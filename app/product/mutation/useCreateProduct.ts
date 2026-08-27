import { useMutation, useQueryClient } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TCreateProduct {
  name: string;
  price: number;
  categoryId: number;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TCreateProduct) => localStore.createProduct(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
