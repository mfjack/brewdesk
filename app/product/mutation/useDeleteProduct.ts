import { API_URL } from "@/_lib/api-url";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteProduct() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (productId: number) => {
         const response = await fetch(`${API_URL}/products/${productId}`, {
            method: "DELETE",
         });

         if (!response.ok) {
            throw new Error("Failed to delete product");
         }
      },

      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["products"] });
      },
   });
}
