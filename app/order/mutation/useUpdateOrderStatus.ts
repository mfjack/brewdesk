import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TUpdateOrderStatusInput } from "@/_lib/store/orders";

export type TUpdateOrderStatus = TUpdateOrderStatusInput;

export const useUpdateOrderStatus = createLocalStoreMutation((input: TUpdateOrderStatus) => localStore.updateOrderStatus(input));
