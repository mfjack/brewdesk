import { useMutation, useQueryClient } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TMarkOrderItemsPrinted {
  orderId: number;
  printedItemQuantities: Record<number, number>;
}

export function useMarkOrderItemsPrinted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, printedItemQuantities }: TMarkOrderItemsPrinted) =>
      localStore.markOrderItemsPrinted(orderId, printedItemQuantities),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["order"],
      });
    },
  });
}
