import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useDeleteOperator = createLocalStoreMutation((operatorId: number) => localStore.deleteOperator(operatorId));
