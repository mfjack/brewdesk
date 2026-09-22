import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useSetContaSettled = createLocalStoreMutation(
  ({ orderId, settled }: { orderId: number; settled: boolean }) => localStore.setContaSettled(orderId, settled),
  ["setContaSettled"],
);
