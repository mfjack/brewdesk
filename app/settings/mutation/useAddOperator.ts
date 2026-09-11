import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TAddOperator {
  name: string;
  pin: string;
}

export function useAddOperator() {
  return useMutation({
    mutationFn: async ({ name, pin }: TAddOperator) => localStore.addOperator(name, pin),
  });
}
