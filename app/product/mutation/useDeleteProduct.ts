import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useDeleteProduct = createLocalStoreMutation((productId: number) => localStore.deleteProduct(productId));
