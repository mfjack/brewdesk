import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface TUpdateOrderStatus {
  orderId: number;
  status: "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED";
  observation?: string;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, observation }: TUpdateOrderStatus) => {
      const response = await fetch(`http://localhost:8080/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, observation }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      return response.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}
