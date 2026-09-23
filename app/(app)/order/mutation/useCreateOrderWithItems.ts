import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOrderItemInput } from "@/_lib/store/orders";

export interface TCreateOrderWithItems {
  customerName: string;
  operatorName?: string | null;
  items: TOrderItemInput[];
}

export const useCreateOrderWithItems = createLocalStoreMutation(
  ({ customerName, operatorName, items }: TCreateOrderWithItems) =>
    localStore.createOrderWithItems(customerName, operatorName, items),
  ["createOrderWithItems"],
);
