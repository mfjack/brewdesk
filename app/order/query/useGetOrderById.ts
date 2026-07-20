import { useQuery } from "@tanstack/react-query";

export function useGetOrderById(orderId: number | null) {
   return useQuery({
      queryKey: ["order", orderId],
      queryFn: async () => {
         const response = await fetch(`http://localhost:8080/orders/${orderId}`);
         return response.json();
      },

      enabled: !!orderId,
   });
}
