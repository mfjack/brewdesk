import { useMutation, useQueryClient } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => localStore.createCategory(name),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
