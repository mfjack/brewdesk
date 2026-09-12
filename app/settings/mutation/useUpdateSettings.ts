import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TStoreSettings } from "@/app/order/interface";

export const useUpdateSettings = createLocalStoreMutation((settings: TStoreSettings) => localStore.updateSettings(settings));
