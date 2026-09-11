import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TCancelOrder {
  orderId: number;
  reason: string;
}

export function useCancelOrder() {
  return useMutation({
    mutationFn: async ({ orderId, reason }: TCancelOrder) => localStore.cancelOrder(orderId, reason),
  });
}
