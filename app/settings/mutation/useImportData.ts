import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useImportData = createLocalStoreMutation((data: unknown) => localStore.importData(data));
