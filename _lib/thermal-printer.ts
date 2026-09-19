"use client";

import { useSyncExternalStore } from "react";

const ENABLED_STORAGE_KEY = "brewdesk.thermal-printer-enabled";
const ENABLED_CHANGE_EVENT = "brewdesk-thermal-printer-enabled-change";

interface TConnectedThermalPrinter {
  device: USBDevice;
  interfaceNumber: number;
  endpointNumber: number;
  productName: string;
}

let connectedPrinter: TConnectedThermalPrinter | null = null;

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

  await device.claimInterface(printerInterface.interfaceNumber);

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

  return openPrinterDevice(device);
}

export async function reconnectThermalPrinter(): Promise<TConnectedThermalPrinter | null> {
  if (!isThermalPrintingSupported()) {
    return null;
  }

  const devices = await navigator.usb.getDevices();
  const device = devices[0];

  if (!device) {
    return null;
  }

  return openPrinterDevice(device);
}

export async function printThermalReceipt(bytes: Uint8Array): Promise<void> {
  if (!connectedPrinter) {
    await reconnectThermalPrinter();
  }

  if (!connectedPrinter) {
    throw new Error("Nenhuma impressora térmica conectada.");
  }

  await connectedPrinter.device.transferOut(connectedPrinter.endpointNumber, bytes as BufferSource);
}
