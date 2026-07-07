"use client";

import { useQuery } from "@tanstack/react-query";

export function useGetOrder() {
   return useQuery({
      queryKey: ["order"],
      queryFn: async () => {
         const response = await fetch("http://localhost:8080/orders");

         if (!response.ok) {
            throw new Error("Failed to fetch orders");
         }

         return response.json();
      },
   });
}
