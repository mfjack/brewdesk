import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TCreateProduct {
  name: string;
  price: number;
  categoryId: number;
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (data: TCreateProduct) => localStore.createProduct(data),
  });
}
