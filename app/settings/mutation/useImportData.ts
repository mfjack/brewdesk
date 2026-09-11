import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useImportData() {
  return useMutation({
    mutationFn: async (data: unknown) => localStore.importData(data),
  });
}
