import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useUpdateOperator = createLocalStoreMutation(
  ({ operatorId, allowedRoutes, isSelfService }: { operatorId: number; allowedRoutes: string[]; isSelfService: boolean }) =>
    localStore.updateOperator(operatorId, allowedRoutes, isSelfService),
  ["updateOperator"],
);
