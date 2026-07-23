import { API_URL } from "@/_lib/api-url";
import { useMutation } from "@tanstack/react-query";

export interface TAddOrderItem {
   orderId: number;
   productId: number;
   quantity: number;
   observation?: string;
}

export function useAddOrderItem() {
   return useMutation({
      mutationFn: async ({ orderId, ...data }: TAddOrderItem) => {
         const response = await fetch(`${API_URL}/orders/${orderId}/items`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
         });

         if (!response.ok) {
            throw new Error("Failed to add item to order");
         }

         return response.json();
      },
   });
}
