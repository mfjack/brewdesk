import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useDeleteOrderRecord = createLocalStoreMutation(
  (orderId: number) => localStore.deleteOrderRecord(orderId),
  ["deleteOrderRecord"],
);
