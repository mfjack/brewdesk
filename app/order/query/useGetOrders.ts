"use client";

import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useGetOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => localStore.getOrders(),
  });
}
