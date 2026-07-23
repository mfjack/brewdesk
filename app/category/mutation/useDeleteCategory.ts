import { API_URL } from "@/_lib/api-url";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteCategory() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (categoryId: number) => {
         const response = await fetch(`${API_URL}/categories/${categoryId}`, {
            method: "DELETE",
         });

         if (!response.ok) {
            throw new Error("Failed to delete category");
         }
      },

      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["categories"] });
      },
   });
}
