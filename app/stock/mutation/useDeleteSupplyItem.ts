import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useDeleteSupplyItem = createLocalStoreMutation((supplyItemId: number) => localStore.deleteSupplyItem(supplyItemId));
