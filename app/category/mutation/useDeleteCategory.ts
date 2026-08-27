import { useMutation, useQueryClient } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: number) => localStore.deleteCategory(categoryId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
