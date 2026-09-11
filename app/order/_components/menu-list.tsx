import { Trash2, NotebookPen, Send, User, DollarSign } from "lucide-react";

import { useEffect, type ReactNode } from "react";
import Image from "next/image";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Card } from "@/_components/ui/card";
import { Switch } from "@/_components/ui/switch";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";

import { TMenuList, TOrderItem } from "../interface";
import { paymentMethodOptions } from "../payment-methods";

import { formatCurrency } from "@/_lib/format-currency";
import { useGetSettings } from "@/app/settings/query/useGetSettings";

import { Input } from "@/_components/ui/input";
import { toTitleCase } from "@/_lib/to-title-case";

export function MenuList({
  order,
  onRemoveItem,
  onSendOrder,
  isSending,
  isRemovingItem,
  observation,
  onObservationChange,
  printedItemQuantities = {},
  onPrintAdditional,

  isNameDialogOpen,
  onNameDialogOpenChange,
  customerNameDraft,
  onCustomerNameDraftChange,
  onConfirmCustomerName,
  nameError,
  isTakeoutDraft,
  onIsTakeoutDraftChange,

  onRequestPayment,
  isPaymentDialogOpen,
  onPaymentDialogOpenChange,
  paymentMethod,
  onPaymentMethodChange,
  amountReceived,
  onAmountReceivedChange,
  onConfirmPayment,
  isConfirmingPayment,
}: TMenuList) {
  const hasItems = (order?.orderItems?.length ?? 0) > 0;

  const { data: settings } = useGetSettings();

  const finalTotal = order?.total ?? 0;

  const changeDue =
    paymentMethod === "CASH" && amountReceived ? Math.max(Number(amountReceived) - finalTotal, 0) : null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "Enter" && hasItems && !isSending) {
        event.preventDefault();

        onSendOrder();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasItems, isSending, onSendOrder]);

  return (
    <div className="w-full md:h-screen md:w-1/2">
      {order && (
        <div className="flex flex-col md:h-full">
          {order.customerName && (
            <>
              <div className="p-4 text-sm text-muted-foreground">
                <p>
                  Cliente: <span className="font-bold">{toTitleCase(order.customerName)}</span>
                </p>
              </div>

              <Separator className="h-px bg-border" />
            </>
          )}

          <div className="flex-1 flex-col gap-4 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {(order.orderItems?.length ?? 0) === 0 ? (
              <p className="flex h-full justify-center items-center text-sm text-muted-foreground">
                Adicione itens do cardápio à comanda.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {order.orderItems.map((item: TOrderItem) => {
                  return (
                    <Card key={item.id} className="flex flex-row items-center justify-between p-4 mb-3">
                      <div className="flex items-center gap-6">
                        <span
                          className="z-10 flex h-6 w-6 items-center justify-center
                            rounded-full bg-background text-xs font-bold text-foreground shadow"
                        >
                          {item.quantity}
                        </span>

                        <div className="flex flex-col items-start">
                          <p className="text-md font-bold">{toTitleCase(item.product.name)}</p>

                          <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</p>
                        </div>
                      </div>

                      <Button
                        size="icon-lg"
                        variant="ghost"
                        className="bg-background"
                        onClick={() => onRemoveItem(item.id)}
                        disabled={isRemovingItem}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative flex items-center w-full px-4 mt-4">
            <NotebookPen className="absolute left-7 h-4 w-4 text-muted-foreground" />

            <Input
              type="text"
              placeholder="Adicionar observação..."
              className="pl-9"
              value={observation}
              onChange={(e) => onObservationChange(e.target.value)}
            />
          </div>

          <div className="flex flex-row items-center justify-between px-2 py-2 w-full">
            <p className="px-4 py-2 text-lg font-bold">Total:</p>

            <span className="px-4 py-2 text-lg font-bold">{formatCurrency(order.total ?? 0)}</span>
          </div>

          {(() => {
            let sendButton: ReactNode = null;

            if (Object.keys(printedItemQuantities).length === 0) {
              sendButton = (
                <Button className="flex-1 flex gap-3" size="lg" onClick={onSendOrder} disabled={isSending || !hasItems}>
                  <Send />
                  Enviar pedido
                </Button>
              );
            } else if (order.orderItems.some((item) => (printedItemQuantities[item.id] ?? 0) < item.quantity)) {
              sendButton = (
                <Button className="flex-1 flex gap-3" size="lg" onClick={onPrintAdditional}>
                  <Send />
                  Enviar pedido
                </Button>
              );
            }

            return (
              <div className="mx-4 mb-4 flex gap-2">
                {sendButton}

                <Button
                  type="button"
                  className="flex-1 flex gap-3"
                  size="lg"
                  variant={sendButton ? "outline" : "default"}
                  onClick={onRequestPayment}
                  disabled={isSending || !hasItems}
                >
                  <DollarSign />
                  Pagamento
                </Button>
              </div>
            );
          })()}

          <Dialog open={isNameDialogOpen} onOpenChange={onNameDialogOpenChange}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Quem é o cliente?</DialogTitle>

                <DialogDescription>Digite o nome para identificar essa comanda antes de enviar.</DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-between rounded-lg border border-input px-3 py-2">
                <p className="text-sm font-medium">Para levar</p>

                <Switch checked={isTakeoutDraft} onCheckedChange={onIsTakeoutDraftChange} />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  autoFocus
                  placeholder="Nome do cliente"
                  className="pl-9"
                  value={customerNameDraft}
                  onChange={(event) => onCustomerNameDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && customerNameDraft.trim()) {
                      event.preventDefault();

                      onConfirmCustomerName();
                    }
                  }}
                />
                {nameError && <p className="text-xs text-center mt-1 text-destructive">{nameError}</p>}
              </div>

              <DialogFooter>
                <Button onClick={onConfirmCustomerName} disabled={!customerNameDraft.trim() || isSending}>
                  <Send />
                  Enviar pedido
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isPaymentDialogOpen} onOpenChange={onPaymentDialogOpenChange}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="flex flex-col gap-0.5">
                <DialogTitle>Confirmar pagamento</DialogTitle>
                <DialogDescription>Venda rápida: confirme o pagamento e finalize sem precisar abrir uma comanda.</DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <p className="text-sm font-medium">Forma de pagamento</p>

                <div className="flex gap-2">
                  {paymentMethodOptions.map(({ value, label, Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={paymentMethod === value ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => onPaymentMethodChange(value)}
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
                      onChange={(e) => onAmountReceivedChange(e.target.value)}
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
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(finalTotal)}</span>
              </div>

              <DialogFooter>
                <Button
                  className="w-full"
                  type="button"
                  size="lg"
                  onClick={onConfirmPayment}
                  disabled={isConfirmingPayment || (paymentMethod === "CASH" && Number(amountReceived) < finalTotal)}
                >
                  <DollarSign />
                  {isConfirmingPayment ? "Processando..." : "Pagamento Recebido"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
