import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export interface TRemoveOrderItem {
  orderId: number;
  itemId: number;
}

export function useRemoveOrderItem() {
  return useMutation({
    mutationFn: async ({ orderId, itemId }: TRemoveOrderItem) => localStore.removeOrderItem(orderId, itemId),
  });
}
