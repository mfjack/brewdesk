import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TMarkOrderItemsPrinted {
  orderId: number;
  printedItemQuantities: Record<number, number>;
}

export function useMarkOrderItemsPrinted() {
  return useMutation({
    mutationFn: async ({ orderId, printedItemQuantities }: TMarkOrderItemsPrinted) =>
      localStore.markOrderItemsPrinted(orderId, printedItemQuantities),
  });
}
