import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export interface TCreateProduct {
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  price: number;
  quantity?: number;
  trackStock?: boolean;
  lowStockThreshold?: number;
  categoryId: number;
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (data: TCreateProduct) => localStore.createProduct(data),
  });
}
