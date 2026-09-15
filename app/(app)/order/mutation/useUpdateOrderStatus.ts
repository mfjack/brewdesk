import type { QueryClient } from "@tanstack/react-query";
import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TUpdateOrderStatusInput } from "@/_lib/store/orders";
import type { TOrderResponse, TStoreSettings } from "@/app/(app)/order/interface";
import { computeOrderTotal } from "@/app/(app)/order/order-math";

export type TUpdateOrderStatus = TUpdateOrderStatusInput;

interface TContext {
  previousOrders: TOrderResponse[] | undefined;
}

export const useUpdateOrderStatus = createLocalStoreMutation(
  (input: TUpdateOrderStatus) => localStore.updateOrderStatus(input),
  ["updateOrderStatus"],
  (queryClient: QueryClient) => ({
    onMutate: async ({ orderId, status, observation, customerName, isTakeout, payments }): Promise<TContext> => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });

      const previousOrders = queryClient.getQueryData<TOrderResponse[]>(["orders"]);
      const settings = queryClient.getQueryData<TStoreSettings>(["settings"]);

      queryClient.setQueryData<TOrderResponse[]>(["orders"], (orders) =>
        orders?.map((order) => {
          if (order.id !== orderId) {
            return order;
          }

          const updatedOrder = { ...order, status };

          if (observation !== undefined) {
            updatedOrder.observation = observation || null;
          }

          if (customerName !== undefined) {
            updatedOrder.customerName = customerName.trim();
          }

          if (isTakeout !== undefined) {
            updatedOrder.isTakeout = isTakeout;
            updatedOrder.total = computeOrderTotal(updatedOrder.orderItems, isTakeout, settings?.takeoutFee);
          }

          if (payments !== undefined) {
            updatedOrder.payments = payments;
          }

          return updatedOrder;
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
