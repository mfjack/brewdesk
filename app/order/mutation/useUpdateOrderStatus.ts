import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOrderPayment, TOrderStatus } from "@/app/order/interface";

export interface TUpdateOrderStatus {
  orderId: number;
  status: Exclude<TOrderStatus, "OPEN">;
  observation?: string;
  customerName?: string;
  isTakeout?: boolean;
  groupWithOrderId?: number | null;
  payments?: TOrderPayment[];
}

export const useUpdateOrderStatus = createLocalStoreMutation(
  ({ orderId, status, observation, customerName, isTakeout, groupWithOrderId, payments }: TUpdateOrderStatus) =>
    localStore.updateOrderStatus(orderId, status, observation, customerName, isTakeout, groupWithOrderId, payments),
);
