"use client";

import { useMemo, useState } from "react";
import { Check, Eye } from "lucide-react";

import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { Button } from "@/_components/ui/button";
import { EmptyState } from "@/_components/ui/empty-state";
import { SearchInput } from "@/_components/ui/search-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/_components/ui/dialog";

import { useGetOrders } from "../order/query/useGetOrders";
import { useGetSettings } from "../settings/query/useGetSettings";
import { useSetFiadoSettled } from "../order/mutation/useSetFiadoSettled";
import { listOpenFiadoOrders } from "@/_lib/fiado";
import { getChargedTakeoutFee } from "../order/order-math";
import type { TOrderResponse } from "../order/interface";
import { formatCurrency } from "@/_lib/format-currency";
import { formatDateTime } from "@/_lib/format-date";
import { toTitleCase } from "@/_lib/to-title-case";

export default function FiadoPage() {
  const { data: settings } = useGetSettings();
  const { data: orders } = useGetOrders();
  const setFiadoSettled = useSetFiadoSettled();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingOrder, setViewingOrder] = useState<TOrderResponse | null>(null);

  const isCreditSaleEnabled = settings?.featureFlags.creditSale ?? false;

  const openOrders = useMemo(() => listOpenFiadoOrders(orders ?? []), [orders]);
  const totalOwed = openOrders.reduce((sum, order) => sum + order.total, 0);

  const filteredOrders = openOrders.filter((order) => order.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

  function handleSettleOrder(orderId: number) {
    setFiadoSettled.mutate({ orderId, settled: true });
  }

  if (!isCreditSaleEnabled) {
    return (
      <section className="flex flex-col h-screen">
        <div className="p-4">
          <Header title="Fiado" />
        </div>

        <Separator className="h-px w-full" />

        <div className="flex-1 p-4">
          <EmptyState message='Ative "Venda fiado" em Configurações pra usar essa página.' />
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 flex-wrap gap-2">
        <Header title="Fiado" description={openOrders.length > 0 ? `${formatCurrency(totalOwed)} a receber` : undefined} />
      </div>

      <Separator className="h-px w-full" />

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {openOrders.length === 0 ? (
          <EmptyState message="Nenhum fiado em aberto." />
        ) : (
          <>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Filtrar por nome do cliente..."
              className="mb-4 max-w-100"
            />

            {filteredOrders.length === 0 ? (
              <EmptyState message="Nenhum fiado encontrado com esse nome." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-input p-3 flex-wrap"
                  >
                    <div>
                      <p className="text-sm font-semibold">{toTitleCase(order.customerName)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                      {order.observation && <p className="text-xs text-muted-foreground">{order.observation}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-destructive">{formatCurrency(order.total)}</span>

                      <Button type="button" variant="outline" size="sm" onClick={() => setViewingOrder(order)}>
                        <Eye />
                        Ver itens
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSettleOrder(order.id)}
                        disabled={setFiadoSettled.isPending}
                      >
                        <Check />
                        Pago
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={viewingOrder !== null} onOpenChange={(open) => !open && setViewingOrder(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="flex flex-col gap-0.5">
            <DialogTitle>{viewingOrder && toTitleCase(viewingOrder.customerName)}</DialogTitle>
            <DialogDescription>{viewingOrder && formatDateTime(viewingOrder.createdAt)}</DialogDescription>
          </DialogHeader>

          {viewingOrder && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                {viewingOrder.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold">{item.quantity}x</span>
                      <span>{toTitleCase(item.product.name)}</span>
                    </div>

                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}

                {viewingOrder.isTakeout && (
                  <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>Embalagem para levar</span>
                    <span className="font-medium">{formatCurrency(getChargedTakeoutFee(viewingOrder))}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-bold text-destructive">{formatCurrency(viewingOrder.total)}</span>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  handleSettleOrder(viewingOrder.id);
                  setViewingOrder(null);
                }}
                disabled={setFiadoSettled.isPending}
              >
                <Check />
                Marcar como pago
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
