import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TUpdateCategory {
  id: number;
  name: string;
}

export const useUpdateCategory = createLocalStoreMutation(({ id, name }: TUpdateCategory) => localStore.updateCategory(id, name));
