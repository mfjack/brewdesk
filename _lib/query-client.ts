import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function createQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
      },
    }),
    defaultOptions: {
      queries: {
        networkMode: "online",
        staleTime: 60 * 1000,
      },
      mutations: {
        networkMode: "online",
      },
    },
  });
}
