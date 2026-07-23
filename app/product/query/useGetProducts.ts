import { API_URL } from "@/_lib/api-url";
import { useQuery } from "@tanstack/react-query";

export function useGetProducts() {
   return useQuery({
      queryKey: ["products"],
      queryFn: async () => {
         const response = await fetch(`${API_URL}/products`);
         return response.json();
      },
   });
}
