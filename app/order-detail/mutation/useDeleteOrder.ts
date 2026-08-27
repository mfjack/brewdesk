import { useMutation, useQueryClient } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TDeleteOrder {
  orderId: number;
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId }: TDeleteOrder) => localStore.deleteOrder(orderId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}
