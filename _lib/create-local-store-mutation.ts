import { useMutation } from "@tanstack/react-query";

/**
 * Fábrica de hooks de mutation que só encaminham o input pra
 * uma função do `localStore`. Elimina o boilerplate repetido
 * em cada arquivo de `mutation/use*.ts`.
 */
export function createLocalStoreMutation<TInput, TOutput>(mutationFn: (input: TInput) => TOutput | Promise<TOutput>) {
  return function useLocalStoreMutation() {
    return useMutation({
      mutationFn: async (input: TInput) => mutationFn(input),
    });
  };
}
