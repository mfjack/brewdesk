import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TDeleteOrder {
  orderId: number;
}

export const useDeleteOrder = createLocalStoreMutation(({ orderId }: TDeleteOrder) => localStore.deleteOrder(orderId));
