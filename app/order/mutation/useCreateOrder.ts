import { API_URL } from "@/_lib/api-url";
import { useMutation } from "@tanstack/react-query";

export interface TCreateOrder {
   customerName: string;
}

export function useCreateOrder() {
   return useMutation({
      mutationFn: async (data: TCreateOrder) => {
         const response = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
         });

         if (!response.ok) {
            throw new Error("Failed to create order");
         }

         return response.json();
      },
   });
}
