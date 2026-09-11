"use client";

import { useEffect, useState } from "react";

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

export function useActiveOperator(): TActiveOperator | null {
  const [active, setActive] = useState<TActiveOperator | null>(getActiveOperator);

  useEffect(() => {
    const handleChange = () => setActive(getActiveOperator());

    window.addEventListener(OPERATOR_CHANGE_EVENT, handleChange);

    return () => window.removeEventListener(OPERATOR_CHANGE_EVENT, handleChange);
  }, []);

  return active;
}
