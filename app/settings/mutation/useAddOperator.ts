import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOperatorRole } from "@/_lib/operator-roles";

export interface TAddOperator {
  name: string;
  pin: string;
  role: TOperatorRole;
}

export const useAddOperator = createLocalStoreMutation(({ name, pin, role }: TAddOperator) => localStore.addOperator(name, pin, role));
