import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useCreateCategory = createLocalStoreMutation((name: string) => localStore.createCategory(name));
