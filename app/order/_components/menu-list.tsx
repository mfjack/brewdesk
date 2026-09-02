import { Trash2, NotebookPen, Send, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Card } from "@/_components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { TMenuList, TOrderItem } from "../interface";
import { formatCurrency } from "@/_lib/format-currency";
import { Input } from "@/_components/ui/input";

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
  onOpenPaymentDialog,
  onConfirmPayment,
  isProcessing,
  isPaymentDialogOpen,
  onPaymentDialogOpenChange,
}: TMenuList) {
  const [localPaymentOpen, setLocalPaymentOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "Enter" && order && (order.orderItems?.length ?? 0) > 0 && !isSending) {
        event.preventDefault();
        onSendOrder();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [order, isSending, onSendOrder]);

  useEffect(() => {
    setLocalPaymentOpen(isPaymentDialogOpen);
  }, [isPaymentDialogOpen]);

  return (
    <div className="h-screen w-1/2">
      {order && (
        <div className="flex flex-col h-full">
          <div className="p-4 text-sm text-muted-foreground">
            <p>
              Comanda de <span className="font-bold">{order.customerName}</span>
            </p>
          </div>

          <Separator className="h-px bg-border" />

          <div className="flex-1 flex-col gap-4 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {(order.orderItems?.length ?? 0) === 0 ? (
              <p className="flex h-full justify-center items-center text-sm text-muted-foreground">
                Adicione itens do cardápio à comanda.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {order.orderItems.map((item: TOrderItem) => {
                  const printedQty = printedItemQuantities[item.id] ?? 0;
                  const isNew = item.quantity > printedQty;
                  return (
                    <Card
                      key={item.id}
                      className={`flex flex-row items-center justify-between p-4 mb-3 ${isNew ? "border-2 border-yellow-400 bg-yellow-50/30" : ""}`}
                    >
                      <div className="flex items-center gap-6">
                        <span
                          className="z-10 flex h-6 w-6 items-center justify-center
                      rounded-full bg-white text-xs font-bold text-black shadow"
                        >
                          {item.quantity}
                        </span>

                        <div className="flex flex-col items-start">
                          <p className="text-md font-bold">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</p>
                        </div>

                        {isNew && <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">NOVO</span>}
                      </div>

                      <Button
                        size="icon-lg"
                        variant="ghost"
                        className="bg-white hover:text-white"
                        onClick={() => onRemoveItem(item.id)}
                        disabled={isRemovingItem}
                      >
                        <Trash2 className="text-destructive hover:text-white" />
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
            <p className="px-4 py-2 text-lg font-bold">Total: </p>
            <span className="px-4 py-2 text-lg font-bold">{formatCurrency(order.total ?? 0)}</span>{" "}
          </div>

          {Object.keys(printedItemQuantities).length === 0 ? (
            <Button
              className="mx-4 mb-4 flex gap-3"
              size="lg"
              onClick={onSendOrder}
              disabled={isSending || (order.orderItems?.length ?? 0) === 0}
            >
              <Send />
              Enviar pedido
            </Button>
          ) : order.orderItems.some((item) => (printedItemQuantities[item.id] ?? 0) < item.quantity) ? (
            <Button className="mx-4 mb-4 flex gap-3" size="lg" onClick={onPrintAdditional}>
              <Send />
              Imprimir pedidos adicional
            </Button>
          ) : (
            <Button className="mx-4 mb-4 flex" size="lg" onClick={onOpenPaymentDialog} disabled={isProcessing}>
              <DollarSign />
              Pagamento
            </Button>
          )}

          <Dialog open={localPaymentOpen} onOpenChange={onPaymentDialogOpenChange}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirmar Pagamento</DialogTitle>
                <DialogDescription>
                  Cliente: <strong>{order.customerName}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {order.orderItems?.map((item: TOrderItem) => (
                  <div key={item.id} className="flex justify-between text-sm p-2 border-b">
                    <span>
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total ?? 0)}</span>
              </div>

              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => onPaymentDialogOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={onConfirmPayment} disabled={isProcessing}>
                  Pagamento Recebido
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
