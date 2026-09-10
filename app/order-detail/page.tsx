"use client";

import { useMemo, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { DollarSign, HandCoins, X } from "lucide-react";
import Link from "next/link";

import { useGetOrder } from "../kitchen/query/useGetOrder";
import { TOrderResponse } from "../order/interface";
import { formatCurrency } from "@/_lib/format-currency";
import { Header } from "@/_components/ui/header";

import { useUpdateOrderStatus } from "../order/mutation/useUpdateOrderStatus";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";

export default function OrderDetailPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<TOrderResponse | null>(null);

  const { data: orders = [] } = useGetOrder();

  const updateOrderStatus = useUpdateOrderStatus();

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "PAID")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter((order) => order.customerName.toLowerCase().includes(searchTerm.toLowerCase())),
    [orders, searchTerm],
  );

  function handleOpenPayment(order: TOrderResponse) {
    setSelectedOrder(order);
  }

  function handleClosePayment() {
    if (updateOrderStatus.isPending) {
      return;
    }

    setSelectedOrder(null);
  }

  async function handleConfirmPayment() {
    if (!selectedOrder) {
      return;
    }

    await updateOrderStatus.mutateAsync({
      orderId: selectedOrder.id,
      status: "PAID",
    });

    setSelectedOrder(null);
  }

  return (
    <section className="flex flex-col h-screen w-full">
      {/* HEADER */}
      <div className="flex flex-col p-4 w-full">
        <div className="flex items-center justify-between">
          <Header title="Comandas" description="Gerencie as comandas: visualize, abra e feche comandas." />

          <Button asChild size="lg" className="w-30">
            <Link href="/order">
              <HandCoins />
              <p>PDV</p>
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="h-px bg-border" />

      <div className="p-4 flex gap-2 w-100">
        <Input
          type="text"
          placeholder="Filtrar por nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />

        {searchTerm && (
          <Button size="icon" variant="ghost" onClick={() => setSearchTerm("")} className="h-10 w-10">
            <X size={16} />
          </Button>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <p className="p-4 text-base text-muted-foreground">
          {searchTerm ? "Nenhuma comanda encontrada com esse nome." : "Nenhuma comanda em aberto."}
        </p>
      ) : (
        <div className="flex-1 overflow-auto p-4 [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredOrders.map((order: TOrderResponse) => (
              <Card className="flex flex-col gap-3 p-4 justify-between" key={order.id}>
                <div className="flex flex-wrap justify-between gap-1">
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-sm">{order.customerName}</span>
                  </div>

                  <span className="text-muted-foreground text-sm font-bold">{formatCurrency(order.total)}</span>
                </div>

                {order.observation && (
                  <p className="text-xs font-bold text-destructive">
                    Observação:
                    <span className="text-xs font-medium text-foreground"> {order.observation}</span>
                  </p>
                )}

                <Button asChild className="w-full mt-4" size="lg" variant="default">
                  <Link href={`/order?orderId=${order.id}`}>Detalhes da comanda</Link>
                </Button>

                <Button type="button" className="w-full" size="lg" variant="outline" onClick={() => handleOpenPayment(order)}>
                  <DollarSign />
                  Pagamento
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) {
            handleClosePayment();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col gap-0.5">
            <DialogTitle>Confirmar pagamento</DialogTitle>
            <DialogDescription>Confirme o recebimento do pagamento da comanda.</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex gap-1">
                <p className="text-sm text-muted-foreground">Cliente: </p>
                <p className="font-bold text-sm">{selectedOrder.customerName}</p>
              </div>

              <div className="space-y-1.5">
                {selectedOrder.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold">{item.quantity}x</span>
                      <span>{item.product.name}</span>
                    </div>

                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              className="w-full"
              type="button"
              size="lg"
              onClick={handleConfirmPayment}
              disabled={updateOrderStatus.isPending || !selectedOrder}
            >
              <DollarSign />

              {updateOrderStatus.isPending ? "Processando..." : "Pagamento Recebido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
