import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";
import type { TRecipeItem } from "@/app/order/interface";

export interface TCreateProduct {
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  price: number;
  costPrice?: number;
  quantity?: number;
  trackStock?: boolean;
  lowStockThreshold?: number;
  categoryId: number;
  supplierId?: number | null;
  recipe?: TRecipeItem[];
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (data: TCreateProduct) => localStore.createProduct(data),
  });
}
