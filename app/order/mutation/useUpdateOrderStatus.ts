import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TUpdateOrderStatus {
  orderId: number;
  status: "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "PAID";
  observation?: string;
  customerName?: string;
  isTakeout?: boolean;
}

export function useUpdateOrderStatus() {
  return useMutation({
    mutationFn: async ({ orderId, status, observation, customerName, isTakeout }: TUpdateOrderStatus) =>
      localStore.updateOrderStatus(orderId, status, observation, customerName, isTakeout),
  });
}
