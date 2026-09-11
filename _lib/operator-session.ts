"use client";

import { useSyncExternalStore } from "react";

const OPERATOR_STORAGE_KEY = "brewdesk.operator";
const OPERATOR_CHANGE_EVENT = "brewdesk-operator-change";

export interface TActiveOperator {
  id: number;
  name: string;
}

export function getActiveOperator(): TActiveOperator | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(OPERATOR_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as TActiveOperator;
  } catch {
    return null;
  }
}

export function setActiveOperator(operator: TActiveOperator | null) {
  if (operator) {
    window.sessionStorage.setItem(OPERATOR_STORAGE_KEY, JSON.stringify(operator));
  } else {
    window.sessionStorage.removeItem(OPERATOR_STORAGE_KEY);
  }

  window.dispatchEvent(new Event(OPERATOR_CHANGE_EVENT));
}

let cachedRaw: string | null = null;
let cachedSnapshot: TActiveOperator | null = null;

function getSnapshot(): TActiveOperator | null {
  const raw = window.sessionStorage.getItem(OPERATOR_STORAGE_KEY);

  if (raw === cachedRaw) {
    return cachedSnapshot;
  }

  cachedRaw = raw;
  cachedSnapshot = getActiveOperator();

  return cachedSnapshot;
}

function getServerSnapshot(): TActiveOperator | null {
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener(OPERATOR_CHANGE_EVENT, callback);

  return () => window.removeEventListener(OPERATOR_CHANGE_EVENT, callback);
}

export function useActiveOperator(): TActiveOperator | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
