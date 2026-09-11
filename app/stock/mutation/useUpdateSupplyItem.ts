import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";
import type { TSupplyItemInput } from "@/_lib/store/supply-items";

export interface TUpdateSupplyItem extends TSupplyItemInput {
  id: number;
}

export function useUpdateSupplyItem() {
  return useMutation({
    mutationFn: async ({ id, ...data }: TUpdateSupplyItem) => localStore.updateSupplyItem(id, data),
  });
}
