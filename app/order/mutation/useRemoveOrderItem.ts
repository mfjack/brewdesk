import { API_URL } from "@/_lib/api-url";
import { useMutation } from "@tanstack/react-query";

export interface TRemoveOrderItem {
   orderId: number;
   itemId: number;
}

export function useRemoveOrderItem() {
   return useMutation({
      mutationFn: async ({ orderId, itemId }: TRemoveOrderItem) => {
         const response = await fetch(`${API_URL}/orders/${orderId}/items/${itemId}`, {
            method: "DELETE",
         });

         if (!response.ok) {
            throw new Error("Failed to remove item from order");
         }

         return response.json();
      },
   });
}
