import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useDeleteSupplier = createLocalStoreMutation((supplierId: number) => localStore.deleteSupplier(supplierId));
