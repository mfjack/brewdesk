import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TAddOrderItem {
  orderId: number;
  productId: number;
  quantity: number;
}

export const useAddOrderItem = createLocalStoreMutation(({ orderId, productId, quantity }: TAddOrderItem) =>
  localStore.addOrderItem(orderId, productId, quantity),
);
