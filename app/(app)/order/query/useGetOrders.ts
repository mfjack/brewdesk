"use client";

import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

interface TUseGetOrders {
  refetchInterval?: number;
}

// A poll interval keeps monitoring-style screens (kitchen board, conta, comandas list) in
// sync across separate tablets without the operator having to refocus the tab or reload —
// left unset for the busy PDV cart screen, where it would fight the in-progress local edits.
export function useGetOrders({ refetchInterval }: TUseGetOrders = {}) {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => localStore.getOrders(),
    refetchInterval,
  });
}
