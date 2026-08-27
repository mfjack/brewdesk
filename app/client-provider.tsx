"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const refreshLocalData = () => {
      queryClient.invalidateQueries();
    };
    window.addEventListener("brewdesk-store-change", refreshLocalData);
    window.addEventListener("storage", refreshLocalData);

    return () => {
      window.removeEventListener("brewdesk-store-change", refreshLocalData);
      window.removeEventListener("storage", refreshLocalData);
    };
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
