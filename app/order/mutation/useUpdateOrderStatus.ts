import { useMutation } from "@tanstack/react-query";

export interface TUpdateOrderStatus {
   orderId: number;
   status: "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED";
}

export function useUpdateOrderStatus() {
   return useMutation({
      mutationFn: async ({ orderId, status }: TUpdateOrderStatus) => {
         const response = await fetch(`http://localhost:8080/orders/${orderId}/status`, {
            method: "PATCH",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
         });

         if (!response.ok) {
            throw new Error("Failed to update order status");
         }

         return response.json();
      },
   });
}
