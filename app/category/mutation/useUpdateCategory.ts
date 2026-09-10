import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export interface TUpdateCategory {
  id: number;
  name: string;
}

export function useUpdateCategory() {
  return useMutation({
    mutationFn: async ({ id, name }: TUpdateCategory) => localStore.updateCategory(id, name),
  });
}
