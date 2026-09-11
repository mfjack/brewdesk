import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";
import type { TSupplierInput } from "@/_lib/store/suppliers";

export interface TUpdateSupplier extends TSupplierInput {
  id: number;
}

export function useUpdateSupplier() {
  return useMutation({
    mutationFn: async ({ id, ...data }: TUpdateSupplier) => localStore.updateSupplier(id, data),
  });
}
