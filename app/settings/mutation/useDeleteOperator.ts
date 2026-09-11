import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export function useDeleteOperator() {
  return useMutation({
    mutationFn: async (operatorId: number) => localStore.deleteOperator(operatorId),
  });
}
