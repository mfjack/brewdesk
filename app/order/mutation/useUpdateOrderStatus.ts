import { useMutation, useQueryClient } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TUpdateOrderStatus {
  orderId: number;
  status: "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED";
  observation?: string;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, observation }: TUpdateOrderStatus) =>
      localStore.updateOrderStatus(orderId, status, observation),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}
