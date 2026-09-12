import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TCreateOrder {
  customerName: string;
  operatorName?: string | null;
}

export const useCreateOrder = createLocalStoreMutation((data: TCreateOrder) =>
  localStore.createOrder(data.customerName, data.operatorName),
);
