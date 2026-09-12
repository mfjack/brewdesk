import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOrderStatus, TPaymentMethod } from "@/app/order/interface";

export interface TUpdateOrderStatus {
  orderId: number;
  status: Exclude<TOrderStatus, "OPEN">;
  observation?: string;
  customerName?: string;
  isTakeout?: boolean;
  paymentMethod?: TPaymentMethod;
  amountReceived?: number | null;
}

export const useUpdateOrderStatus = createLocalStoreMutation(
  ({ orderId, status, observation, customerName, isTakeout, paymentMethod, amountReceived }: TUpdateOrderStatus) =>
    localStore.updateOrderStatus(
      orderId,
      status,
      observation,
      customerName,
      isTakeout,
      paymentMethod !== undefined ? { paymentMethod, amountReceived } : undefined,
    ),
);
