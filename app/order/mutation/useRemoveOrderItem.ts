import { useMutation } from "@tanstack/react-query";

export interface TRemoveOrderItem {
   orderId: number;
   itemId: number;
}

export function useRemoveOrderItem() {
   return useMutation({
      mutationFn: async ({ orderId, itemId }: TRemoveOrderItem) => {
         const response = await fetch(`http://localhost:8080/orders/${orderId}/items/${itemId}`, {
            method: "DELETE",
         });

         if (!response.ok) {
            throw new Error("Failed to remove item from order");
         }

         return response.json();
      },
   });
}
