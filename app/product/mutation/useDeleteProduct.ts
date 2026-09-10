import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async (productId: number) => localStore.deleteProduct(productId),
  });
}
