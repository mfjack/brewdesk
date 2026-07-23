"use client";

import { API_URL } from "@/_lib/api-url";
import { useQuery } from "@tanstack/react-query";

export function useGetOrder() {
   return useQuery({
      queryKey: ["order"],
      queryFn: async () => {
         const response = await fetch(`${API_URL}/orders`);

         if (!response.ok) {
            throw new Error("Failed to fetch orders");
         }

         return response.json();
      },
   });
}
