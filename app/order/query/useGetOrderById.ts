import { API_URL } from "@/_lib/api-url";
import { useQuery } from "@tanstack/react-query";

export function useGetOrderById(orderId: number | null) {
   return useQuery({
      queryKey: ["order", orderId],
      queryFn: async () => {
         const response = await fetch(`${API_URL}/orders/${orderId}`);
         return response.json();
      },

      enabled: !!orderId,
   });
}
