import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TDeletePaidOrders {
  orderIds: number[];
}

export const useDeletePaidOrders = createLocalStoreMutation(
  ({ orderIds }: TDeletePaidOrders) => localStore.deletePaidOrders(orderIds),
  ["deletePaidOrders"],
);
