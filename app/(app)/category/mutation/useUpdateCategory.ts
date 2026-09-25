import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TUpdateCategory {
  id: number;
  name: string;
  price: number | null;
}

export const useUpdateCategory = createLocalStoreMutation(
  ({ id, name, price }: TUpdateCategory) => localStore.updateCategory(id, name, price),
  ["updateCategory"],
);
