"use client";

import { useSyncExternalStore } from "react";
import { onlineManager, useQueryClient } from "@tanstack/react-query";

export function useNetworkStatus() {
  const queryClient = useQueryClient();

  const isOnline = useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
    () => true,
  );

  const pendingCount = useSyncExternalStore(
    (callback) => queryClient.getMutationCache().subscribe(callback),
    () => queryClient.getMutationCache().getAll().filter((mutation) => mutation.state.isPaused).length,
    () => 0,
  );

  return { isOnline, pendingCount };
}
