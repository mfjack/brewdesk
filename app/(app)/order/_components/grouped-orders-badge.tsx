import { Users } from "lucide-react";

import { toTitleCase } from "@/_lib/to-title-case";
import type { TOrderResponse } from "../interface";

interface TGroupedOrdersBadge {
  groupedOrders: TOrderResponse[];
  variant?: "compact" | "board";
  className?: string;
  // Defaults to the "Juntar comanda" (combined payment) label — pass "Junto com" for the
  // separate, payment-independent kitchen-grouping badge.
  label?: string;
}

export function GroupedOrdersBadge({
  groupedOrders,
  variant = "compact",
  className = "",
  label = "Pagamento junto com",
}: TGroupedOrdersBadge) {
  if (groupedOrders.length === 0) {
    return null;
  }

  const names = groupedOrders.map((groupedOrder) => toTitleCase(groupedOrder.customerName)).join(", ");

  if (variant === "board") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Users size={14} />
        <span className="text-sm font-bold">{label.toUpperCase()}:</span>
        <span className="text-sm font-medium">{names}</span>
      </div>
    );
  }

  return (
    <p className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <Users size={12} />
      {label}: <span className="font-medium">{names}</span>
    </p>
  );
}
