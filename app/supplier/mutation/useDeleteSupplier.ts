import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useDeleteSupplier() {
  return useMutation({
    mutationFn: async (supplierId: number) => localStore.deleteSupplier(supplierId),
  });
}
