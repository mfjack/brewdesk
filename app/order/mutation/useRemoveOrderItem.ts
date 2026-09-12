import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TRemoveOrderItem {
  orderId: number;
  itemId: number;
}

export const useRemoveOrderItem = createLocalStoreMutation(({ orderId, itemId }: TRemoveOrderItem) =>
  localStore.removeOrderItem(orderId, itemId),
);
