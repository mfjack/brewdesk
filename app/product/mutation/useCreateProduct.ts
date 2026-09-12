import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TProductInput } from "@/_lib/store/products";

export type TCreateProduct = TProductInput;

export const useCreateProduct = createLocalStoreMutation((data: TCreateProduct) => localStore.createProduct(data));
