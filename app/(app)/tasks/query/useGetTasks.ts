import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";

export function useGetTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () => localStore.getTasks(),
  });
}
