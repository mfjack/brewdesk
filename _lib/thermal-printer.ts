"use client";

import { useSyncExternalStore } from "react";

const ENABLED_STORAGE_KEY = "brewdesk.thermal-printer-enabled";
const ENABLED_CHANGE_EVENT = "brewdesk-thermal-printer-enabled-change";
const DEVICE_STORAGE_KEY = "brewdesk.thermal-printer-device";

interface TConnectedThermalPrinter {
  device: USBDevice;
  interfaceNumber: number;
  endpointNumber: number;
  productName: string;
}

// Identifies the specific printer that was paired, so reconnecting on a later visit (or
// after a print job) can find that exact device among navigator.usb.getDevices() instead
// of just grabbing whichever USB device happens to come first — which silently breaks as
// soon as more than one device has ever been granted permission on this origin.
interface TSavedThermalPrinterDevice {
  vendorId: number;
  productId: number;
  serialNumber: string | null;
  productName: string;
}

let connectedPrinter: TConnectedThermalPrinter | null = null;

function getSavedThermalPrinterDevice(): TSavedThermalPrinterDevice | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(DEVICE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as TSavedThermalPrinterDevice;
  } catch {
    return null;
  }
}

function saveThermalPrinterDevice(device: TSavedThermalPrinterDevice): void {
  window.localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(device));
}

// Shown in Configurações even before a live reconnect succeeds (e.g. printer unplugged),
// so the operator can see which printer is expected instead of just "nenhuma pareada".
export function getSavedThermalPrinterName(): string | null {
  return getSavedThermalPrinterDevice()?.productName ?? null;
}

export function isThermalPrintingSupported(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator;
}

export function isThermalPrintingEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ENABLED_STORAGE_KEY) === "true";
}

export function setThermalPrintingEnabled(enabled: boolean): void {
  window.localStorage.setItem(ENABLED_STORAGE_KEY, String(enabled));
  window.dispatchEvent(new Event(ENABLED_CHANGE_EVENT));
}

function subscribeThermalPrintingEnabled(callback: () => void) {
  window.addEventListener(ENABLED_CHANGE_EVENT, callback);

  return () => window.removeEventListener(ENABLED_CHANGE_EVENT, callback);
}

function getServerSnapshotThermalPrintingEnabled(): boolean {
  return false;
}

export function useThermalPrintingEnabled(): boolean {
  return useSyncExternalStore(subscribeThermalPrintingEnabled, isThermalPrintingEnabled, getServerSnapshotThermalPrintingEnabled);
}

export function getConnectedThermalPrinterName(): string | null {
  return connectedPrinter?.productName ?? null;
}

async function openPrinterDevice(device: USBDevice): Promise<TConnectedThermalPrinter> {
  if (!device.opened) {
    await device.open();
  }

  const configuration = device.configuration ?? device.configurations[0];

  if (device.configuration === null) {
    await device.selectConfiguration(configuration.configurationValue);
  }

  const printerInterface = configuration.interfaces.find((iface) =>
    iface.alternates.some((alternate) => alternate.endpoints.some((endpoint) => endpoint.direction === "out")),
  );

  if (!printerInterface) {
    throw new Error("Não foi possível encontrar uma interface de impressão nesse dispositivo USB.");
  }

  try {
    await device.claimInterface(printerInterface.interfaceNumber);
  } catch {
    // The most common cause by far: Windows already has the printer's own driver (or a
    // generic printer-class driver) attached to this USB interface, and only one driver
    // can hold it at a time — WebUSB can't claim an interface a native driver is using.
    throw new Error(
      "A porta USB está sendo usada por outro driver (comum quando a impressora já tem um driver instalado no Windows). " +
        "Troque o driver dela pra WinUSB com o Zadig (zadig.akeo.ie) e tente parear de novo.",
    );
  }

  const alternate = printerInterface.alternates.find((candidate) =>
    candidate.endpoints.some((endpoint) => endpoint.direction === "out"),
  );

  const endpoint = alternate?.endpoints.find((candidate) => candidate.direction === "out");

  if (!endpoint) {
    throw new Error("Não foi possível encontrar uma saída de dados nesse dispositivo USB.");
  }

  connectedPrinter = {
    device,
    interfaceNumber: printerInterface.interfaceNumber,
    endpointNumber: endpoint.endpointNumber,
    productName: device.productName || "Impressora térmica",
  };

  return connectedPrinter;
}

// Requires a real user gesture (e.g. a button click) — browsers refuse to show the
// device picker otherwise. Uses an empty filter so any USB device shows up, since
// there's no known vendor/product ID list for every thermal printer brand.
export async function connectThermalPrinter(): Promise<TConnectedThermalPrinter> {
  const device = await navigator.usb.requestDevice({ filters: [] });
  const printer = await openPrinterDevice(device);

  saveThermalPrinterDevice({
    vendorId: device.vendorId,
    productId: device.productId,
    serialNumber: device.serialNumber ?? null,
    productName: printer.productName,
  });

  return printer;
}

export async function reconnectThermalPrinter(): Promise<TConnectedThermalPrinter | null> {
  if (!isThermalPrintingSupported()) {
    return null;
  }

  const savedDevice = getSavedThermalPrinterDevice();

  if (!savedDevice) {
    return null;
  }

  const devices = await navigator.usb.getDevices();
  const device = devices.find(
    (candidate) =>
      candidate.vendorId === savedDevice.vendorId &&
      candidate.productId === savedDevice.productId &&
      (savedDevice.serialNumber === null || candidate.serialNumber === savedDevice.serialNumber),
  );

  if (!device) {
    return null;
  }

  return openPrinterDevice(device);
}

// Serializes print jobs onto the same USB connection. Without this, two jobs fired close
// together (e.g. printing a grouped/combined payment's receipts back to back) could have
// their transferOut calls overlap on the wire, truncating whichever job was still sending
// and merging its unsent tail (often the total + cut command, printed last) with the next
// job's start — exactly the "leftover total from the previous receipt" symptom this fixes.
let printQueue: Promise<void> = Promise.resolve();

async function transferReceiptBytes(bytes: Uint8Array): Promise<void> {
  if (!connectedPrinter) {
    await reconnectThermalPrinter();
  }

  if (!connectedPrinter) {
    throw new Error("Nenhuma impressora térmica conectada.");
  }

  await connectedPrinter.device.transferOut(connectedPrinter.endpointNumber, bytes as BufferSource);
}

export function printThermalReceipt(bytes: Uint8Array): Promise<void> {
  const job = printQueue.then(() => transferReceiptBytes(bytes));

  // Keeps the queue moving even if this job fails, so one failed print doesn't
  // permanently stall every print that comes after it.
  printQueue = job.catch(() => undefined);

  return job;
}
