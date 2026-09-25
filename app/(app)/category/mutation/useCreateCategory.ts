import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TCreateCategory {
  name: string;
  price: number | null;
}

export const useCreateCategory = createLocalStoreMutation(
  ({ name, price }: TCreateCategory) => localStore.createCategory(name, price),
  ["createCategory"],
);
