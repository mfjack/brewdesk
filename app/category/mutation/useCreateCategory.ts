import { API_URL } from "@/_lib/api-url";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateCategory() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (name: string) => {
         const response = await fetch(`${API_URL}/categories`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
         });

         if (!response.ok) {
            throw new Error("Failed to create category");
         }

         return response.json();
      },

      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["categories"] });
      },
   });
}
