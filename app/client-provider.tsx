"use client";

import { QueryClientProvider, onlineManager, type QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useEffect, useState } from "react";
import { supabase } from "@/_lib/supabase/client";
import { createQueryClient } from "@/_lib/query-client";

const TABLE_QUERY_KEYS: Record<string, string[]> = {
  categories: ["categories", "products"],
  suppliers: ["suppliers"],
  supply_items: ["supplyItems"],
  products: ["products"],
  settings: ["settings"],
  operators: ["settings"],
  orders: ["orders", "order", "report"],
  establishments: ["settings"],
  tasks: ["tasks"],
};

function invalidateQueryKeys(queryClient: QueryClient, queryKeys: string[]) {
  queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const persister = createSyncStoragePersister({ storage: window.localStorage, key: "tably-query-cache" });

    const [unsubscribePersister, persistPromise] = persistQueryClient({ queryClient, persister });

    persistPromise.then(() => queryClient.resumePausedMutations());

    const handleStoreChange = (event: Event) => {
      const queryKeys = (event as CustomEvent<{ queryKeys: string[] }>).detail?.queryKeys ?? [];

      invalidateQueryKeys(queryClient, queryKeys);
    };
    window.addEventListener("brewdesk-store-change", handleStoreChange);

    const unsubscribeOnlineManager = onlineManager.subscribe((isOnline) => {
      if (isOnline) {
        queryClient.resumePausedMutations();
      }
    });

    const channel = Object.keys(TABLE_QUERY_KEYS)
      .reduce(
        (builtChannel, table) =>
          builtChannel.on("postgres_changes", { event: "*", schema: "public", table }, () =>
            invalidateQueryKeys(queryClient, TABLE_QUERY_KEYS[table]),
          ),
        supabase.channel("brewdesk-realtime"),
      )
      .subscribe();

    return () => {
      window.removeEventListener("brewdesk-store-change", handleStoreChange);
      unsubscribeOnlineManager();
      unsubscribePersister();
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
