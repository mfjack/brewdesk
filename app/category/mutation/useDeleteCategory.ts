import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useDeleteCategory = createLocalStoreMutation((categoryId: number) => localStore.deleteCategory(categoryId));
