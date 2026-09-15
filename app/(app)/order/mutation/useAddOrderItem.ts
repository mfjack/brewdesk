import type { QueryClient } from "@tanstack/react-query";
import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOrderResponse, TProduct, TStoreSettings } from "@/app/(app)/order/interface";
import { computeOrderTotal, mergeOrderItem } from "@/app/(app)/order/order-math";

export interface TAddOrderItem {
  orderId: number;
  productId: number;
  quantity: number;
}

interface TContext {
  previousOrders: TOrderResponse[] | undefined;
}

function nextItemId(items: TOrderResponse["orderItems"]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export const useAddOrderItem = createLocalStoreMutation(
  ({ orderId, productId, quantity }: TAddOrderItem) => localStore.addOrderItem(orderId, productId, quantity),
  ["addOrderItem"],
  (queryClient: QueryClient) => ({
    onMutate: async ({ orderId, productId, quantity }): Promise<TContext> => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });

      const previousOrders = queryClient.getQueryData<TOrderResponse[]>(["orders"]);
      const products = queryClient.getQueryData<TProduct[]>(["products"]);
      const settings = queryClient.getQueryData<TStoreSettings>(["settings"]);
      const product = products?.find((item) => item.id === productId);

      if (product) {
        queryClient.setQueryData<TOrderResponse[]>(["orders"], (orders) =>
          orders?.map((order) => {
            if (order.id !== orderId) {
              return order;
            }

            const orderItems = mergeOrderItem(order.orderItems, product, quantity, () => nextItemId(order.orderItems));

            return { ...order, orderItems, total: computeOrderTotal(orderItems, order.isTakeout, settings?.takeoutFee) };
          }),
        );
      }

      return { previousOrders };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }
    },
  }),
);
