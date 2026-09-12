"use client";

import { useMemo, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/_components/ui/tabs";
import { DollarSign, HandCoins, X } from "lucide-react";
import Link from "next/link";

import { useGetOrder } from "../order/query/useGetOrder";
import { TOrderResponse, TPaymentMethod } from "../order/interface";
import { isOrderPaid } from "../order/order-math";
import { paymentMethodLabels } from "../order/payment-methods";
import { PaymentMethodFields } from "../order/_components/payment-method-fields";
import { formatCurrency } from "@/_lib/format-currency";
import { Header } from "@/_components/ui/header";
import { useGetSettings } from "@/app/settings/query/useGetSettings";

import { useUpdateOrderStatus } from "../order/mutation/useUpdateOrderStatus";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { toTitleCase } from "@/_lib/to-title-case";
import { formatDateTime } from "@/_lib/format-date";

function toDateInputValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return localDate.toISOString().slice(0, 10);
}

export default function OrderDetailPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [historyOrder, setHistoryOrder] = useState<TOrderResponse | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<TOrderResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<TPaymentMethod>("CASH");
  const [amountReceived, setAmountReceived] = useState("");

  const { data: orders = [] } = useGetOrder();
  const { data: settings } = useGetSettings();

  const updateOrderStatus = useUpdateOrderStatus();

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => !isOrderPaid(order))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter((order) => order.customerName.toLowerCase().includes(searchTerm.toLowerCase())),
    [orders, searchTerm],
  );

  const paidOrders = useMemo(
    () =>
      orders
        .filter((order) => isOrderPaid(order))
        .filter((order) => order.customerName.toLowerCase().includes(historySearchTerm.toLowerCase()))
        .filter((order) => !historyDate || toDateInputValue(new Date(order.createdAt)) === historyDate)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, historySearchTerm, historyDate],
  );

  const finalTotal = selectedOrder?.total ?? 0;

  function handleOpenPayment(order: TOrderResponse) {
    setSelectedOrder(order);
    setPaymentMethod("CASH");
    setAmountReceived("");
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
      paymentMethod,
      amountReceived: paymentMethod === "CASH" ? Number(amountReceived) || 0 : null,
    });

    setSelectedOrder(null);
  }

  return (
    <section className="flex flex-col h-screen w-full">
      <div className="flex flex-col p-4 w-full">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Header title="Comandas" />

          <Button asChild size="lg" className="w-30">
            <Link href="/order">
              <HandCoins />
              <p>PDV</p>
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="h-px bg-border" />

      <Tabs defaultValue="open" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-4">
          <TabsList className="rounded-md bg-muted p-2 flex gap-6 justify-start w-fit">
            <TabsTrigger value="open">Em Aberto</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="open" className="flex-1 flex flex-col overflow-hidden">
          {filteredOrders.length > 0 && (
            <div className="p-4 flex gap-2 w-full max-w-100">
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
          )}

          {filteredOrders.length === 0 ? (
            <p className="p-12 text-sm text-center text-muted-foreground">
              {searchTerm ? "Nenhuma comanda encontrada com esse nome." : "Nenhuma comanda em aberto."}
            </p>
          ) : (
            <div className="flex-1 overflow-auto p-4 no-scrollbar">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredOrders.map((order: TOrderResponse) => (
                  <Card className="flex flex-col gap-2 p-4 justify-between" key={order.id}>
                    <span className="font-bold text-lg text-center">{toTitleCase(order.customerName)}</span>

                    {order.operatorName && (
                      <p className="text-xs text-center text-muted-foreground">Atendente: {toTitleCase(order.operatorName)}</p>
                    )}

                    {order.observation && (
                      <p className="text-xs font-bold">
                        Observação:
                        <span className="text-xs font-medium text-muted-foreground"> {order.observation}</span>
                      </p>
                    )}

                    <Button asChild className="w-full mt-2" size="lg" variant="default">
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
        </TabsContent>

        <TabsContent value="history" className="flex-1 flex flex-col overflow-hidden">
          <p className="px-4 pt-4 text-xs text-muted-foreground">
            Comandas pagas há mais de 60 dias são removidas automaticamente.
          </p>

          <div className="p-4 flex flex-col sm:flex-row gap-2 w-full sm:max-w-160">
            <Input
              type="text"
              placeholder="Filtrar por nome do cliente..."
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              className="flex-1"
            />

            <Input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} className="sm:w-48" />

            {(historySearchTerm || historyDate) && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setHistorySearchTerm("");
                  setHistoryDate("");
                }}
                className="h-10 w-10"
              >
                <X size={16} />
              </Button>
            )}
          </div>

          {paidOrders.length === 0 ? (
            <p className="p-12 text-sm text-center text-muted-foreground">
              {historySearchTerm || historyDate
                ? "Nenhuma comanda paga encontrada com esse filtro."
                : "Nenhuma comanda paga ainda."}
            </p>
          ) : (
            <div className="flex-1 overflow-auto p-4 no-scrollbar">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {paidOrders.map((order: TOrderResponse) => (
                  <Card className="flex flex-col gap-2 p-4 justify-between" key={order.id}>
                    <span className="font-bold text-lg text-center">{toTitleCase(order.customerName)}</span>

                    <p className="text-xs text-center text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>

                    {order.operatorName && (
                      <p className="text-xs text-center text-muted-foreground">Atendente: {toTitleCase(order.operatorName)}</p>
                    )}

                    <p className="text-center font-bold">{formatCurrency(order.total)}</p>

                    <Button
                      type="button"
                      className="w-full mt-2"
                      size="lg"
                      variant="outline"
                      onClick={() => setHistoryOrder(order)}
                    >
                      Ver detalhes
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(historyOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryOrder(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col gap-0.5">
            <DialogTitle>Detalhes da comanda</DialogTitle>
            <DialogDescription>Consulta de uma comanda já paga.</DialogDescription>
          </DialogHeader>

          {historyOrder && (
            <div className="space-y-4">
              <div className="flex gap-1">
                <p className="text-sm text-muted-foreground">Cliente: </p>
                <p className="font-bold text-sm">{toTitleCase(historyOrder.customerName)}</p>
              </div>

              <div className="flex gap-1">
                <p className="text-sm text-muted-foreground">Data: </p>
                <p className="text-sm font-medium">{formatDateTime(historyOrder.createdAt)}</p>
              </div>

              {historyOrder.operatorName && (
                <div className="flex gap-1">
                  <p className="text-sm text-muted-foreground">Atendente: </p>
                  <p className="text-sm font-medium">{toTitleCase(historyOrder.operatorName)}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-1.5">
                {historyOrder.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold">{item.quantity}x</span>
                      <span>{toTitleCase(item.product.name)}</span>
                    </div>

                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(historyOrder.total)}</span>
              </div>

              {historyOrder.paymentMethod && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Forma de pagamento</span>
                  <span className="font-medium text-foreground">{paymentMethodLabels[historyOrder.paymentMethod]}</span>
                </div>
              )}

              {historyOrder.paymentMethod === "CASH" && historyOrder.amountReceived != null && (
                <>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Valor recebido</span>
                    <span className="font-medium text-foreground">{formatCurrency(historyOrder.amountReceived)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Troco</span>
                    <span className="font-medium text-foreground">{formatCurrency(historyOrder.changeDue ?? 0)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex gap-1">
                  <p className="text-sm text-muted-foreground">Cliente: </p>
                  <p className="font-bold text-sm">{toTitleCase(selectedOrder.customerName)}</p>
                </div>
                <div className="space-y-1.5">
                  {selectedOrder.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex gap-2">
                        <span className="font-semibold">{item.quantity}x</span>
                        <span>{toTitleCase(item.product.name)}</span>
                      </div>

                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-xl font-bold">{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <Separator />

              <PaymentMethodFields
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                amountReceived={amountReceived}
                onAmountReceivedChange={setAmountReceived}
                total={finalTotal}
                pixQrCodeUrl={settings?.pixQrCodeUrl}
              />

              <Separator />

              <Button
                className="w-full"
                type="button"
                size="lg"
                onClick={handleConfirmPayment}
                disabled={
                  updateOrderStatus.isPending ||
                  !selectedOrder ||
                  (paymentMethod === "CASH" && Number(amountReceived) < finalTotal)
                }
              >
                <DollarSign />

                {updateOrderStatus.isPending ? "Processando..." : "Pagamento Recebido"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
