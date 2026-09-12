import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TSupplyItemInput } from "@/_lib/store/supply-items";

export interface TUpdateSupplyItem extends TSupplyItemInput {
  id: number;
}

export const useUpdateSupplyItem = createLocalStoreMutation(({ id, ...data }: TUpdateSupplyItem) => localStore.updateSupplyItem(id, data));
