import type { QueryClient } from "@tanstack/react-query";
import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOrderResponse } from "@/app/(app)/order/interface";

export interface TMarkOrderItemsPrinted {
  orderId: number;
  printedItemQuantities: Record<number, number>;
}

interface TContext {
  previousOrders: TOrderResponse[] | undefined;
}

export const useMarkOrderItemsPrinted = createLocalStoreMutation(
  ({ orderId, printedItemQuantities }: TMarkOrderItemsPrinted) => localStore.markOrderItemsPrinted(orderId, printedItemQuantities),
  ["markOrderItemsPrinted"],
  (queryClient: QueryClient) => ({
    onMutate: async ({ orderId, printedItemQuantities }): Promise<TContext> => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });

      const previousOrders = queryClient.getQueryData<TOrderResponse[]>(["orders"]);

      queryClient.setQueryData<TOrderResponse[]>(["orders"], (orders) =>
        orders?.map((order) => (order.id === orderId ? { ...order, printedItemQuantities: { ...printedItemQuantities } } : order)),
      );

      return { previousOrders };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }
    },
  }),
);
