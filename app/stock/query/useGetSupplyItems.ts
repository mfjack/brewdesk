import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useGetSupplyItems() {
  return useQuery({
    queryKey: ["supplyItems"],
    queryFn: () => localStore.getSupplyItems(),
  });
}
