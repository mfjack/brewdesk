import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOrderItemInput } from "@/_lib/store/orders";

export interface TCreateOrderWithItems {
  customerName: string;
  operatorName?: string | null;
  items: TOrderItemInput[];
  isTakeout?: boolean;
}

export const useCreateOrderWithItems = createLocalStoreMutation(
  ({ customerName, operatorName, items, isTakeout }: TCreateOrderWithItems) =>
    localStore.createOrderWithItems(customerName, operatorName, items, isTakeout),
  ["createOrderWithItems"],
);
