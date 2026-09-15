import { useMutation, useQueryClient, type MutationKey, type QueryClient, type UseMutationOptions } from "@tanstack/react-query";

export function createLocalStoreMutation<TInput, TOutput, TContext = unknown>(
  mutationFn: (input: TInput) => TOutput | Promise<TOutput>,
  mutationKey: MutationKey,
  buildExtraOptions?: (queryClient: QueryClient) => Pick<UseMutationOptions<TOutput, Error, TInput, TContext>, "onMutate" | "onError">,
) {
  return function useLocalStoreMutation() {
    const queryClient = useQueryClient();

    queryClient.setMutationDefaults(mutationKey, {
      mutationFn: async (input: TInput) => mutationFn(input),
    });

    return useMutation({
      mutationKey,
      mutationFn: async (input: TInput) => mutationFn(input),
      ...buildExtraOptions?.(queryClient),
    });
  };
}
