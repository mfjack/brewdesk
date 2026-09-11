import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";
import type { TSupplierInput } from "@/_lib/store/suppliers";

export function useCreateSupplier() {
  return useMutation({
    mutationFn: async (data: TSupplierInput) => localStore.createSupplier(data),
  });
}
