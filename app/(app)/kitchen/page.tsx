"use client";

import { useState } from "react";
import { Card } from "@/_components/ui/card";
import { Separator } from "@/_components/ui/separator";
import { useGetOrders } from "../order/query/useGetOrders";
import { TOrderResponse } from "../order/interface";
import { getGroupedOrders } from "../order/order-math";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { useUpdateOrderStatus } from "../order/mutation/useUpdateOrderStatus";
import { Check, HandPlatter, Play } from "lucide-react";
import { Header } from "@/_components/ui/header";
import { useGetSettings } from "../settings/query/useGetSettings";
import { GroupedOrdersBadge } from "../order/_components/grouped-orders-badge";

export default function KitchenPage() {
  const { data: orders = [] } = useGetOrders({ refetchInterval: 8000 });
  const { data: settings } = useGetSettings();
  const updateOrderStatus = useUpdateOrderStatus();
  const [statusError, setStatusError] = useState<string | null>(null);

  const pendingOrders = orders.filter((order: TOrderResponse) => order.status === "PENDING");
  const inProgressOrders = orders.filter((order: TOrderResponse) => order.status === "IN_PROGRESS");
  const readyOrders = orders.filter((order: TOrderResponse) => order.status === "READY");

  const columns = [
    {
      title: "Aguardando",
      orders: pendingOrders,
      badgeClassName: "bg-transparent text-foreground border-border",
      emptyMessage: "Nenhum pedido pendente.",
      actionLabel: "Iniciar Preparo",
      icon: <Play />,
    },
    {
      title: "Preparando",
      orders: inProgressOrders,
      badgeClassName: "bg-muted text-foreground border-border",
      emptyMessage: "Nenhum pedido em preparo.",
      actionLabel: "Marcar como pronto",
      icon: <Check />,
    },
    {
      title: "Pronto",
      orders: readyOrders,
      badgeClassName: "bg-foreground text-background border-transparent",
      emptyMessage: "Nenhum pedido pronto.",
      actionLabel: "Pronto para Entrega",
      icon: <HandPlatter />,
    },
  ] as const;

  function getStatusLabel(status: TOrderResponse["status"]): string {
    switch (status) {
      case "OPEN":
        return "Aberta";
      case "PENDING":
        return "Pendente";
      case "IN_PROGRESS":
        return "Preparando";
      case "READY":
        return "Pronto";
      case "DELIVERED":
        return "Entregue";
      case "PAID":
        return "Paga";
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }

  async function handleAdvanceStatus(order: TOrderResponse) {
    const nextStatus = order.status === "PENDING" ? "IN_PROGRESS" : order.status === "IN_PROGRESS" ? "READY" : "DELIVERED";

    try {
      await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: nextStatus,
      });

      setStatusError(null);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Não foi possível atualizar o status do pedido.");
    }
  }

  return (
    <section className="flex flex-col h-screen">
      <div className="flex flex-col p-4">
        <Header title="Cozinha" />
      </div>

      <Separator className="h-px w-full" />

      {statusError && (
        <p className="mx-4 mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{statusError}</p>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 overflow-y-auto no-scrollbar">
        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-4 ">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-current" />
              <h2 className="text-lg font-bold">{column.title}</h2>
              <span className="text-sm text-muted-foreground">({column.orders.length})</span>
            </div>

            <div className="flex flex-col gap-4 ">
              {column.orders.length === 0 ? (
                <Card className="p-4 text-sm text-muted-foreground">{column.emptyMessage}</Card>
              ) : (
                column.orders.map((order: TOrderResponse) => (
                  <Card key={order.id} className="flex flex-col gap-2 p-4">
                    <div className="flex justify-between gap-2">
                      <div className="flex gap-2 items-center">
                        <span className="font-bold text-sm">{order.customerName}</span>
                        <span className="text-foreground text-xs">#{order.id}</span>
                      </div>

                      <Badge className={column.badgeClassName}>{getStatusLabel(order.status)}</Badge>
                    </div>

                    {order.observation && (
                      <div className="flex gap-1 items-center">
                        <span className="text-sm font-bold">OBSERVAÇÃO:</span>
                        <span className="text-sm font-medium">{order.observation}</span>
                      </div>
                    )}

                    <GroupedOrdersBadge
                      groupedOrders={settings?.featureFlags.orderGrouping ? getGroupedOrders(order, orders) : []}
                      variant="board"
                    />

                    {order.orderItems.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {order.orderItems.map((item: TOrderResponse["orderItems"][number]) => (
                          <div key={item.id} className="flex flex-row gap-2">
                            <span className="text-base font-medium">{item.quantity}</span>
                            <span className="text-base font-medium">{item.product.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button size={"lg"} onClick={() => handleAdvanceStatus(order)} disabled={updateOrderStatus.isPending}>
                      <span>{column.icon}</span>
                      <span>{column.actionLabel}</span>
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
