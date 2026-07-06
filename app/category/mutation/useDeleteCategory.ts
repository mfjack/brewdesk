import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteCategory() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (categoryId: number) => {
         const response = await fetch(`http://localhost:8080/categories/${categoryId}`, {
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
