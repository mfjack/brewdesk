import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export interface TCreateOrder {
  customerName: string;
  operatorName?: string | null;
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (data: TCreateOrder) => localStore.createOrder(data.customerName, data.operatorName),
  });
}
