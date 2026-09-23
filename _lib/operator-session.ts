"use client";

import { useSyncExternalStore } from "react";

const OPERATOR_STORAGE_KEY = "brewdesk.operator";
const OPERATOR_CHANGE_EVENT = "brewdesk-operator-change";

export interface TActiveOperator {
  id: number;
  name: string;
}

function isValidActiveOperator(value: unknown): value is TActiveOperator {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<TActiveOperator>;

  return typeof candidate.id === "number" && typeof candidate.name === "string";
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
    const parsed = JSON.parse(stored);

    if (!isValidActiveOperator(parsed)) {
      window.sessionStorage.removeItem(OPERATOR_STORAGE_KEY);

      return null;
    }

    return parsed;
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

// Once operators exist, the app forces a PIN login for everyone (see OperatorGate), so
// activeOperator is only null in single-owner mode without the PIN system set up at all.
export function useIsMasterOperator(operators: { id: number }[] | undefined): boolean {
  const activeOperator = useActiveOperator();

  return !activeOperator || operators?.[0]?.id === activeOperator.id;
}

// Lets a self-service kiosk and a staff-operated register run at the same time: the
// behavior is tied to which operator is logged into that specific device, not a global flag.
export function useIsSelfServiceOperator(operators: { id: number; isSelfService: boolean }[] | undefined): boolean {
  const activeOperator = useActiveOperator();

  if (!activeOperator) {
    return false;
  }

  return operators?.find((operator) => operator.id === activeOperator.id)?.isSelfService ?? false;
}
