import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useGetSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => localStore.getSuppliers(),
  });
}
