"use client";

import { WifiOff } from "lucide-react";

import { Badge } from "@/_components/ui/badge";
import { useNetworkStatus } from "@/_lib/use-network-status";

export function NetworkStatusBadge() {
  const { isOnline, pendingCount } = useNetworkStatus();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <Badge variant="outline" className="w-full justify-center gap-1.5 py-1.5">
      <WifiOff size={14} />
      {isOnline
        ? `Sincronizando ${pendingCount} ${pendingCount === 1 ? "ação" : "ações"}...`
        : pendingCount > 0
          ? `Offline — ${pendingCount} ${pendingCount === 1 ? "ação pendente" : "ações pendentes"}`
          : "Offline"}
    </Badge>
  );
}
