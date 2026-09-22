"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

// Returns `undefined` until the client has hydrated, then the real data — avoids the
// "server sees empty cache, client sees localStorage-persisted data" mismatch that trips
// React's hydration warning when a query result is rendered directly on mount.
export function useHydratedData<T>(data: T): T | undefined {
  const isHydrated = useIsHydrated();

  return isHydrated ? data : undefined;
}
