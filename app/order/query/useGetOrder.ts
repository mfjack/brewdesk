"use client";

import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useGetOrder() {
  return useQuery({
    queryKey: ["order"],
    queryFn: () => localStore.getOrders(),
  });
}
