import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import { TCreateProduct } from "./useCreateProduct";

export interface TUpdateProduct extends TCreateProduct {
  id: number;
}

export const useUpdateProduct = createLocalStoreMutation(({ id, ...data }: TUpdateProduct) => localStore.updateProduct(id, data));
