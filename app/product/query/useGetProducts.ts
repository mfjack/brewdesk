import { useQuery } from "@tanstack/react-query";

export function useGetProducts() {
   return useQuery({
      queryKey: ["products"],
      queryFn: async () => {
         const response = await fetch("http://localhost:8080/products");
         return response.json();
      },
   });
}
