import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useDeleteSupplyItem() {
  return useMutation({
    mutationFn: async (supplyItemId: number) => localStore.deleteSupplyItem(supplyItemId),
  });
}
