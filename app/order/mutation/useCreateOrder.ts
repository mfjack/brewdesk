import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TCreateOrder {
  customerName: string;
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (data: TCreateOrder) => localStore.createOrder(data.customerName),
  });
}
