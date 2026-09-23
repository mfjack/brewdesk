import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOperator } from "@/app/(app)/order/interface";

export type TAddOperator = Pick<TOperator, "name" | "pin" | "allowedRoutes" | "isSelfService">;

export const useAddOperator = createLocalStoreMutation(
  ({ name, pin, allowedRoutes, isSelfService }: TAddOperator) =>
    localStore.addOperator(name, pin, allowedRoutes, isSelfService),
  ["addOperator"],
);
