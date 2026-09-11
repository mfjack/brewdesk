import { useMutation } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";
import type { TStoreSettings } from "@/app/order/interface";

export function useUpdateSettings() {
  return useMutation({
    mutationFn: async (settings: TStoreSettings) => localStore.updateSettings(settings),
  });
}
