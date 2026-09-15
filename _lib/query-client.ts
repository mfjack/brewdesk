import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
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
