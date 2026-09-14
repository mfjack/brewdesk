import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TOperator } from "@/app/order/interface";

export type TAddOperator = Pick<TOperator, "name" | "pin" | "role">;

export const useAddOperator = createLocalStoreMutation(({ name, pin, role }: TAddOperator) => localStore.addOperator(name, pin, role));
