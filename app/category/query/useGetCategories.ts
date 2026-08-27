import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";

export function useGetCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => localStore.getCategories(),
  });
}
