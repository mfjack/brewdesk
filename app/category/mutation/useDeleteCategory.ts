import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export function useDeleteCategory() {
  return useMutation({
    mutationFn: async (categoryId: number) => localStore.deleteCategory(categoryId),
  });
}
