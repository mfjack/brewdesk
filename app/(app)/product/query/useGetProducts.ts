import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useGetProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => localStore.getProducts(),
  });
}
