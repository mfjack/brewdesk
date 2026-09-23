import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useUpdateOperatorRoutes = createLocalStoreMutation(
  ({ operatorId, allowedRoutes }: { operatorId: number; allowedRoutes: string[] }) =>
    localStore.updateOperatorRoutes(operatorId, allowedRoutes),
  ["updateOperatorRoutes"],
);
