import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useGetSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => localStore.getSettings(),
  });
}
