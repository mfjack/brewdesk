"use client";

import { useMemo, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { Banknote, CreditCard, DollarSign, HandCoins, Landmark, QrCode, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { useGetOrder } from "../kitchen/query/useGetOrder";
import { TOrderResponse, TPaymentMethod } from "../order/interface";
import { formatCurrency } from "@/_lib/format-currency";
import { Header } from "@/_components/ui/header";
import { useGetSettings } from "@/app/settings/query/useGetSettings";

import { useUpdateOrderStatus } from "../order/mutation/useUpdateOrderStatus";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { toTitleCase } from "@/_lib/to-title-case";

const paymentMethodOptions: { value: TPaymentMethod; label: string; Icon: typeof Banknote }[] = [
  { value: "CASH", label: "Dinheiro", Icon: Banknote },
  { value: "CREDIT", label: "Crédito", Icon: CreditCard },
  { value: "DEBIT", label: "Débito", Icon: Landmark },
  { value: "PIX", label: "Pix", Icon: QrCode },
];

export default function OrderDetailPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<TOrderResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<TPaymentMethod>("CASH");
  const [amountReceived, setAmountReceived] = useState("");

  const { data: orders = [] } = useGetOrder();
  const { data: settings } = useGetSettings();

  const updateOrderStatus = useUpdateOrderStatus();

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "PAID")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter((order) => order.customerName.toLowerCase().includes(searchTerm.toLowerCase())),
    [orders, searchTerm],
  );

  const finalTotal = selectedOrder?.total ?? 0;

  const changeDue = paymentMethod === "CASH" && amountReceived ? Math.max(Number(amountReceived) - finalTotal, 0) : null;

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
        <div className="flex-1 overflow-auto p-4 [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredOrders.map((order: TOrderResponse) => (
              <Card className="flex flex-col gap-2 p-4 justify-between" key={order.id}>
                <span className="font-bold text-lg text-center uppercase">{order.customerName}</span>

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

              <div className="space-y-2">
                <p className="text-sm font-medium">Forma de pagamento</p>

                <div className="flex gap-2">
                  {paymentMethodOptions.map(({ value, label, Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={paymentMethod === value ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setPaymentMethod(value)}
                    >
                      <Icon />
                      {label}
                    </Button>
                  ))}
                </div>

                {paymentMethod === "CASH" && (
                  <div className="space-y-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Valor recebido"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                    />

                    {changeDue !== null && <p className="text-sm text-muted-foreground">Troco: {formatCurrency(changeDue)}</p>}
                  </div>
                )}

                {paymentMethod === "PIX" && (
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4">
                    {settings?.pixQrCodeUrl ? (
                      <>
                        <Image
                          src={settings.pixQrCodeUrl}
                          alt="QR Code Pix"
                          width={200}
                          height={200}
                          className="h-48 w-48 object-contain"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Peça pro cliente escanear o QR Code com o app do banco.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center">
                        Nenhum QR Code cadastrado. Configure em Configurações.
                      </p>
                    )}
                  </div>
                )}
                <Separator />

                <Button
                  className="w-full mt-4"
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
