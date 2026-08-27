import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TAddOrderItem {
  orderId: number;
  productId: number;
  quantity: number;
  observation?: string;
}

export function useAddOrderItem() {
  return useMutation({
    mutationFn: async ({ orderId, productId, quantity, observation }: TAddOrderItem) =>
      localStore.addOrderItem(orderId, productId, quantity, observation),
  });
}
