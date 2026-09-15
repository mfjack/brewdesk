import type { QueryClient } from "@tanstack/react-query";
import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOrderResponse, TStoreSettings } from "@/app/(app)/order/interface";
import { computeOrderTotal, decrementOrRemoveItem } from "@/app/(app)/order/order-math";

export interface TRemoveOrderItem {
  orderId: number;
  itemId: number;
}

interface TContext {
  previousOrders: TOrderResponse[] | undefined;
}

export const useRemoveOrderItem = createLocalStoreMutation(
  ({ orderId, itemId }: TRemoveOrderItem) => localStore.removeOrderItem(orderId, itemId),
  ["removeOrderItem"],
  (queryClient: QueryClient) => ({
    onMutate: async ({ orderId, itemId }): Promise<TContext> => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });

      const previousOrders = queryClient.getQueryData<TOrderResponse[]>(["orders"]);
      const settings = queryClient.getQueryData<TStoreSettings>(["settings"]);

      queryClient.setQueryData<TOrderResponse[]>(["orders"], (orders) =>
        orders?.map((order) => {
          if (order.id !== orderId) {
            return order;
          }

          const orderItems = decrementOrRemoveItem(order.orderItems, itemId);

          return { ...order, orderItems, total: computeOrderTotal(orderItems, order.isTakeout, settings?.takeoutFee) };
        }),
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
