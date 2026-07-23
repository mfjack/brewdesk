import { API_URL } from "@/_lib/api-url";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface TCreateProduct {
   name: string;
   price: number;
   categoryId: number;
}

export function useCreateProduct() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (data: TCreateProduct) => {
         const response = await fetch(`${API_URL}/products`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
         });

         if (!response.ok) {
            throw new Error("Failed to create product");
         }

         return response.json();
      },

      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["products"] });
      },
   });
}
