import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";
import type { TSupplyItemInput } from "@/_lib/store/supply-items";

export function useCreateSupplyItem() {
  return useMutation({
    mutationFn: async (data: TSupplyItemInput) => localStore.createSupplyItem(data),
  });
}
