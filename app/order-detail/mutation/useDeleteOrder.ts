import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export interface TDeleteOrder {
  orderId: number;
}

export function useDeleteOrder() {
  return useMutation({
    mutationFn: async ({ orderId }: TDeleteOrder) => localStore.deleteOrder(orderId),
  });
}
