import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TAddOperator {
  name: string;
  pin: string;
}

export const useAddOperator = createLocalStoreMutation(({ name, pin }: TAddOperator) => localStore.addOperator(name, pin));
