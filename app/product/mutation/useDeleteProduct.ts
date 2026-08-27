import { useMutation, useQueryClient } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => localStore.deleteProduct(productId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
