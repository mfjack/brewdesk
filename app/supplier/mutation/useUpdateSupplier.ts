import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TSupplierInput } from "@/_lib/store/suppliers";

export interface TUpdateSupplier extends TSupplierInput {
  id: number;
}

export const useUpdateSupplier = createLocalStoreMutation(({ id, ...data }: TUpdateSupplier) => localStore.updateSupplier(id, data));
