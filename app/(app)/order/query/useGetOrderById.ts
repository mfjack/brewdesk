import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useGetOrderById(orderId: number | null) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const order = await localStore.getOrder(orderId as number);
      return order || null;
    },
    enabled: !!orderId,
  });
}
