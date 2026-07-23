import { API_URL } from "@/_lib/api-url";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface TDeleteOrder {
   orderId: number;
}

export function useDeleteOrder() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ orderId }: TDeleteOrder) => {
         const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: "DELETE",
         });

         if (!response.ok) {
            throw new Error("Failed to delete category");
         }
      },

      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["order"] });
      },
   });
}
