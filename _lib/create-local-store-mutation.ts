import { useMutation } from "@tanstack/react-query";

export function createLocalStoreMutation<TInput, TOutput>(mutationFn: (input: TInput) => TOutput | Promise<TOutput>) {
  return function useLocalStoreMutation() {
    return useMutation({
      mutationFn: async (input: TInput) => mutationFn(input),
    });
  };
}
