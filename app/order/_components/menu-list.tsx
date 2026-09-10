import { Trash2, NotebookPen, Send, User } from "lucide-react";

import { useEffect } from "react";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Card } from "@/_components/ui/card";
import { Switch } from "@/_components/ui/switch";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";

import { TMenuList, TOrderItem } from "../interface";

import { formatCurrency } from "@/_lib/format-currency";

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
}: TMenuList) {
  const hasItems = (order?.orderItems?.length ?? 0) > 0;

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
    <div className="h-screen w-1/2">
      {order && (
        <div className="flex flex-col h-full">
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
                            rounded-full bg-white text-xs font-bold text-black shadow"
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
            <p className="px-4 py-2 text-lg font-bold">Total:</p>

            <span className="px-4 py-2 text-lg font-bold">{formatCurrency(order.total ?? 0)}</span>
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
              Enviar pedido
            </Button>
          ) : null}

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
        </div>
      )}
    </div>
  );
}
