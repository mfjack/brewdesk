import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useCreateCategory() {
  return useMutation({
    mutationFn: async (name: string) => localStore.createCategory(name),
  });
}
