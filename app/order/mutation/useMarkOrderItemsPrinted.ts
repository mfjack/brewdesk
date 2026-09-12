import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TMarkOrderItemsPrinted {
  orderId: number;
  printedItemQuantities: Record<number, number>;
}

export const useMarkOrderItemsPrinted = createLocalStoreMutation(({ orderId, printedItemQuantities }: TMarkOrderItemsPrinted) =>
  localStore.markOrderItemsPrinted(orderId, printedItemQuantities),
);
