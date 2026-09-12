import { Trash2, NotebookPen, Send, User, DollarSign, Ban } from "lucide-react";

import { useEffect } from "react";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Card } from "@/_components/ui/card";
import { Switch } from "@/_components/ui/switch";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";

import { TMenuList, TOrderItem } from "../interface";
import { DRAFT_ORDER_ID } from "../order-math";
import { PaymentMethodFields } from "./payment-method-fields";

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

  onRequestCancelOrder,
  isCancelDialogOpen,
  onCancelDialogOpenChange,
  onConfirmCancelOrder,
  isCancelling,
}: TMenuList) {
  const hasItems = (order?.orderItems?.length ?? 0) > 0;
  const isExistingOrder = order?.id !== undefined && order.id !== DRAFT_ORDER_ID;

  const { data: settings } = useGetSettings();

  const finalTotal = order?.total ?? 0;

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

          <div className="flex-1 flex-col gap-4 p-4 overflow-y-auto no-scrollbar">
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
            const isFirstSend = Object.keys(printedItemQuantities).length === 0;
            const hasUnprintedItems = order.orderItems.some((item) => (printedItemQuantities[item.id] ?? 0) < item.quantity);
            const showSendButton = isFirstSend || hasUnprintedItems;

            return (
              <div className="mx-4 mb-4 flex gap-2">
                {showSendButton && (
                  <Button
                    className="flex-1 flex gap-3"
                    size="lg"
                    onClick={isFirstSend ? onSendOrder : onPrintAdditional}
                    disabled={isFirstSend && (isSending || !hasItems)}
                  >
                    <Send />
                    Enviar pedido
                  </Button>
                )}

                <Button
                  type="button"
                  className="flex-1 flex gap-3"
                  size="lg"
                  variant={showSendButton ? "outline" : "default"}
                  onClick={onRequestPayment}
                  disabled={isSending || !hasItems}
                >
                  <DollarSign />
                  Pagamento
                </Button>
              </div>
            );
          })()}

          {isExistingOrder && (
            <div className="mx-4 mb-4">
              <Button
                type="button"
                variant="destructive"
                className="w-full flex gap-3"
                size="lg"
                onClick={onRequestCancelOrder}
                disabled={isSending}
              >
                <Ban />
                Cancelar comanda
              </Button>
            </div>
          )}

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

              <PaymentMethodFields
                paymentMethod={paymentMethod}
                onPaymentMethodChange={onPaymentMethodChange}
                amountReceived={amountReceived}
                onAmountReceivedChange={onAmountReceivedChange}
                total={finalTotal}
                pixQrCodeUrl={settings?.pixQrCodeUrl}
              />

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

          <Dialog open={isCancelDialogOpen} onOpenChange={onCancelDialogOpenChange}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="flex flex-col gap-0.5">
                <DialogTitle>Cancelar comanda?</DialogTitle>
                <DialogDescription>
                  Essa ação remove a comanda e devolve os itens ao estoque. Não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onCancelDialogOpenChange(false)}
                  disabled={isCancelling}
                >
                  Voltar
                </Button>

                <Button type="button" variant="destructive" className="flex-1" onClick={onConfirmCancelOrder} disabled={isCancelling}>
                  {isCancelling ? "Cancelando..." : "Cancelar comanda"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
