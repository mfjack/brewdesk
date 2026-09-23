import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOrderItemInput } from "@/_lib/store/orders";

export interface TAddOrderItems {
  orderId: number;
  items: TOrderItemInput[];
}

export const useAddOrderItems = createLocalStoreMutation(
  ({ orderId, items }: TAddOrderItems) => localStore.addOrderItems(orderId, items),
  ["addOrderItems"],
);
