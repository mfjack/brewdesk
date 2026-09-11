import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";
import { TCreateProduct } from "./useCreateProduct";

export interface TUpdateProduct extends TCreateProduct {
  id: number;
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ id, ...data }: TUpdateProduct) => localStore.updateProduct(id, data),
  });
}
