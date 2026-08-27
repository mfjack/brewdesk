import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export function useGetOrderById(orderId: number | null) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => localStore.getOrder(orderId as number),

    enabled: !!orderId,
  });
}
