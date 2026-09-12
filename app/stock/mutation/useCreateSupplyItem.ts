import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TSupplyItemInput } from "@/_lib/store/supply-items";

export const useCreateSupplyItem = createLocalStoreMutation((data: TSupplyItemInput) => localStore.createSupplyItem(data));
