import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";
import type { TPaymentMethod } from "@/app/order/interface";

export interface TUpdateOrderStatus {
  orderId: number;
  status: "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "PAID";
  observation?: string;
  customerName?: string;
  isTakeout?: boolean;
  paymentMethod?: TPaymentMethod;
  amountReceived?: number | null;
}

export function useUpdateOrderStatus() {
  return useMutation({
    mutationFn: async ({ orderId, status, observation, customerName, isTakeout, paymentMethod, amountReceived }: TUpdateOrderStatus) =>
      localStore.updateOrderStatus(
        orderId,
        status,
        observation,
        customerName,
        isTakeout,
        paymentMethod !== undefined ? { paymentMethod, amountReceived } : undefined,
      ),
  });
}
