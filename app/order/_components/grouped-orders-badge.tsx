import { Users } from "lucide-react";

import { toTitleCase } from "@/_lib/to-title-case";
import type { TOrderResponse } from "../interface";

interface TGroupedOrdersBadge {
  groupedOrders: TOrderResponse[];
  variant?: "compact" | "board";
  className?: string;
}

export function GroupedOrdersBadge({ groupedOrders, variant = "compact", className = "" }: TGroupedOrdersBadge) {
  if (groupedOrders.length === 0) {
    return null;
  }

  const names = groupedOrders.map((groupedOrder) => toTitleCase(groupedOrder.customerName)).join(", ");

  if (variant === "board") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Users size={14} />
        <span className="text-sm font-bold">JUNTO COM:</span>
        <span className="text-sm font-medium">{names}</span>
      </div>
    );
  }

  return (
    <p className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <Users size={12} />
      Junto com: <span className="font-medium">{names}</span>
    </p>
  );
}
