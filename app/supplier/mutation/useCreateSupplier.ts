import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TSupplierInput } from "@/_lib/store/suppliers";

export const useCreateSupplier = createLocalStoreMutation((data: TSupplierInput) => localStore.createSupplier(data));
