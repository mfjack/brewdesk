import { API_URL } from "@/_lib/api-url";
import { useQuery } from "@tanstack/react-query";

export function useGetCategories() {
   return useQuery({
      queryKey: ["categories"],
      queryFn: async () => {
         const response = await fetch(`${API_URL}/categories`);
         return response.json();
      },
   });
}
