import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useSetFiadoSettled = createLocalStoreMutation(
  ({ orderId, settled }: { orderId: number; settled: boolean }) => localStore.setFiadoSettled(orderId, settled),
  ["setFiadoSettled"],
);
