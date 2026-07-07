import { useQuery } from "@tanstack/react-query";

export function useGetCategories() {
   return useQuery({
      queryKey: ["categories"],
      queryFn: async () => {
         const response = await fetch("http://localhost:8080/categories");
         return response.json();
      },
   });
}
