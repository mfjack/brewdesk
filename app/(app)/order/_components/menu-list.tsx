import { Trash2, NotebookPen, User, DollarSign, Pencil, Wallet, Printer, Users } from "lucide-react";

import { useEffect } from "react";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Card } from "@/_components/ui/card";
import { Switch } from "@/_components/ui/switch";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";

import { TMenuList, TOrderItem } from "../interface";
import { DRAFT_ORDER_ID } from "../order-math";
import { PaymentDialog } from "./payment-dialog";
import { GroupedOrdersBadge } from "./grouped-orders-badge";
import { EditOrderDialog } from "./edit-order-dialog";

import { formatCurrency } from "@/_lib/format-currency";
import { useGetSettings } from "@/app/(app)/settings/query/useGetSettings";

import { Input } from "@/_components/ui/input";
import { toTitleCase } from "@/_lib/to-title-case";

function CartItemCard({
  item,
  removable,
  onRemove,
  disabled,
}: {
  item: TOrderItem;
  removable: boolean;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <Card className={`flex flex-row items-center justify-between p-4 mb-3 ${removable ? "" : "opacity-80"}`}>
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

      {removable && (
        <Button size="icon-lg" variant="ghost" className="bg-background" onClick={onRemove} disabled={disabled}>
          <Trash2 className="text-destructive" />
        </Button>
      )}
    </Card>
  );
}

// A plain label for a read-only section (an already-sent linked order); becomes a real
// toggle button — same filled/outline convention as the category tabs above — once there
// are two carts being built at once ("Junto com", not yet sent), so it's clear at a glance
// that it's clickable and which one is currently getting the new items.
function CartSectionHeader({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  if (!onClick) {
    return <p className="text-xs font-bold uppercase text-muted-foreground mb-1">{label}</p>;
  }

  return (
    <Button type="button" variant={active ? "default" : "outline"} size="sm" className="self-start mb-1" onClick={onClick}>
      <Users />
      {label}
      {active && " — adicionando aqui"}
    </Button>
  );
}

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
  nameDialogIntent,
  customerNameDraft,
  onCustomerNameDraftChange,
  onConfirmCustomerName,
  nameError,
  isTakeoutDraft,
  onIsTakeoutDraftChange,
  groupedOrders,
  kitchenGroupedOrders,
  secondaryCustomerName,
  secondaryOrderItems,
  onRemoveSecondaryItem,
  activeCartTarget,
  onSelectCartTarget,
  isJuntoComDialogOpen,
  onOpenJuntoComDialog,
  onJuntoComDialogOpenChange,
  juntoComNameDraft,
  onJuntoComNameDraftChange,
  onConfirmJuntoComName,
  onRemoveJuntoCom,

  onRegisterConta,

  onRequestPayment,
  isPaymentDialogOpen,
  onPaymentDialogOpenChange,
  onEditOrderFromPayment,
  isPayingExistingComanda,
  paymentOrder,
  paymentMethod,
  onPaymentMethodChange,
  amountReceived,
  onAmountReceivedChange,
  onConfirmPayment,
  isConfirmingPayment,
  isSplitOpen,
  onSplitOpenChange,
  onConfirmSplitPayment,

  onRequestCancelOrder,
  isCancelDialogOpen,
  onCancelDialogOpenChange,
  onConfirmCancelOrder,
  isCancelling,

  categories,
  selectedCategory,
  onCategoryClick,
  filteredProducts,
  products,
  supplyItems,
  onAddProduct,
  stockError,
  isEditOrderDialogOpen,
  onEditOrderDialogOpenChange,
  onResendFullOrder,
  isResendingFullOrder,
  isSelfServiceEnabled,
}: TMenuList) {
  const hasItems = (order?.orderItems?.length ?? 0) > 0;
  const isExistingOrder = order?.id !== undefined && order.id !== DRAFT_ORDER_ID;

  const { data: settings } = useGetSettings();

  const isTakeoutEnabled = settings?.featureFlags.takeout ?? true;
  const isOrderGroupingEnabled = settings?.featureFlags.orderGrouping ?? true;
  const isOrderTicketsEnabled = settings?.featureFlags.orderTickets ?? true;
  const isCreditSaleEnabled = settings?.featureFlags.creditSale ?? false;

  // Shows every linked order's items here for visibility, whether linked for combined
  // payment ("Juntar comanda") or just to prepare/print together ("Junto com") — dedup in
  // case an order somehow ends up linked both ways.
  const linkedOrders = isOrderGroupingEnabled
    ? [...groupedOrders, ...kitchenGroupedOrders].filter(
        (linkedOrder, index, all) => all.findIndex((candidate) => candidate.id === linkedOrder.id) === index,
      )
    : [];

  // A second person's cart being built alongside this one, not sent yet.
  const hasSecondaryCart = secondaryCustomerName.trim().length > 0;

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
    <div className="w-full min-w-0 md:h-screen md:w-1/2">
      {order && (
        <div className="flex flex-col md:h-full">
          <div className="px-4 h-18 flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <div>
              {order.customerName && (
                <p>
                  Cliente: <span className="font-bold">{toTitleCase(order.customerName)}</span>
                </p>
              )}

              <GroupedOrdersBadge groupedOrders={isOrderGroupingEnabled ? groupedOrders : []} />
              <GroupedOrdersBadge groupedOrders={isOrderGroupingEnabled ? kitchenGroupedOrders : []} label="Junto com" />

              {secondaryCustomerName && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users size={12} />
                  Junto com: <span className="font-medium">{toTitleCase(secondaryCustomerName)}</span>
                </p>
              )}
            </div>

            {isOrderGroupingEnabled && (
              <Button type="button" variant="outline" onClick={onOpenJuntoComDialog}>
                <Users />
                Junto com
              </Button>
            )}
          </div>
          <Separator className="h-px bg-border" />

          <div className="flex-1 flex-col gap-4 p-4 overflow-y-auto no-scrollbar">
            {(order.orderItems?.length ?? 0) === 0 && linkedOrders.length === 0 && !hasSecondaryCart ? (
              <p className="flex h-full justify-center items-center text-sm text-muted-foreground">
                Adicione itens do cardápio à comanda.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {(linkedOrders.length > 0 || hasSecondaryCart) && (
                  <CartSectionHeader
                    label={toTitleCase(order.customerName || "Você")}
                    active={activeCartTarget === "primary"}
                    onClick={hasSecondaryCart ? () => onSelectCartTarget("primary") : undefined}
                  />
                )}

                {order.orderItems.map((item: TOrderItem) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    removable
                    onRemove={() => onRemoveItem(item.id)}
                    disabled={isRemovingItem}
                  />
                ))}

                {hasSecondaryCart && (
                  <div className="mt-2 flex flex-col gap-1">
                    <CartSectionHeader
                      label={toTitleCase(secondaryCustomerName)}
                      active={activeCartTarget === "secondary"}
                      onClick={() => onSelectCartTarget("secondary")}
                    />

                    {secondaryOrderItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum item ainda.</p>
                    ) : (
                      secondaryOrderItems.map((item: TOrderItem) => (
                        <CartItemCard key={item.id} item={item} removable onRemove={() => onRemoveSecondaryItem(item.id)} />
                      ))
                    )}
                  </div>
                )}

                {linkedOrders.map((linkedOrder) => (
                  <div key={linkedOrder.id} className="mt-3 flex flex-col gap-1">
                    <CartSectionHeader label={toTitleCase(linkedOrder.customerName)} />

                    {linkedOrder.orderItems.map((item: TOrderItem) => (
                      <CartItemCard key={item.id} item={item} removable={false} />
                    ))}
                  </div>
                ))}
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

            <span className="px-4 py-2 text-lg font-bold">{formatCurrency(paymentOrder?.total ?? order.total ?? 0)}</span>
          </div>

          {(() => {
            const isFirstSend = Object.keys(printedItemQuantities).length === 0;
            const hasUnprintedItems = order.orderItems.some((item) => (printedItemQuantities[item.id] ?? 0) < item.quantity);
            const showSendButton = isOrderTicketsEnabled && (isFirstSend || hasUnprintedItems);

            return (
              <div className="mx-4 mb-3 flex gap-2">
                {showSendButton && (
                  <Button
                    className="flex-1 flex gap-3"
                    size="lg"
                    onClick={isFirstSend ? onSendOrder : onPrintAdditional}
                    disabled={isFirstSend && (isSending || !hasItems)}
                  >
                    <Printer />
                    Imprimir pedido
                  </Button>
                )}

                {!isSelfServiceEnabled && (
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
                )}
              </div>
            );
          })()}

          {isExistingOrder && (
            <div className="mx-4 mb-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex gap-3"
                size="lg"
                onClick={() => onEditOrderDialogOpenChange(true)}
                disabled={isSending}
              >
                <Pencil />
                Alterar pedido
              </Button>
            </div>
          )}

          <Dialog open={isNameDialogOpen} onOpenChange={onNameDialogOpenChange}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Quem é o cliente?</DialogTitle>

                <DialogDescription>
                  {nameDialogIntent === "payment"
                    ? "Digite o nome do cliente antes de continuar para o pagamento."
                    : "Digite o nome para identificar essa comanda antes de enviar."}
                </DialogDescription>
              </DialogHeader>

              {isTakeoutEnabled && (
                <div className="flex items-center justify-between rounded-lg border border-input px-3 py-2">
                  <p className="text-sm font-medium">Para levar</p>

                  <Switch checked={isTakeoutDraft} onCheckedChange={onIsTakeoutDraftChange} />
                </div>
              )}

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

              <DialogFooter className="flex-row gap-2">
                {isCreditSaleEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onRegisterConta}
                    disabled={!customerNameDraft.trim() || isSending}
                  >
                    <Wallet />
                    Registrar conta
                  </Button>
                )}

                <Button className="flex-1" onClick={onConfirmCustomerName} disabled={!customerNameDraft.trim() || isSending}>
                  {nameDialogIntent === "payment" ? (
                    <>
                      <DollarSign />
                      Continuar para pagamento
                    </>
                  ) : (
                    <>
                      <Printer />
                      Imprimir pedido
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <PaymentDialog
            open={isPaymentDialogOpen}
            onOpenChange={onPaymentDialogOpenChange}
            order={paymentOrder}
            description={
              isOrderGroupingEnabled && groupedOrders.length > 0
                ? "Confirme o recebimento do pagamento conjunto das comandas agrupadas."
                : isPayingExistingComanda
                  ? "Confirme o recebimento do pagamento da comanda."
                  : "Venda rápida: confirme o pagamento e finalize sem precisar abrir uma comanda."
            }
            requirePaymentMethod={isPayingExistingComanda}
            error={stockError}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={onPaymentMethodChange}
            amountReceived={amountReceived}
            onAmountReceivedChange={onAmountReceivedChange}
            isSplitOpen={isSplitOpen}
            onSplitOpenChange={onSplitOpenChange}
            onConfirmSplitPayment={onConfirmSplitPayment}
            onConfirmPayment={onConfirmPayment}
            isConfirmingPayment={isConfirmingPayment}
            onEditOrder={isExistingOrder && !isPayingExistingComanda ? onEditOrderFromPayment : undefined}
          />

          <Dialog open={isCancelDialogOpen} onOpenChange={onCancelDialogOpenChange}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="flex flex-col gap-0.5">
                <DialogTitle>Cancelar comanda?</DialogTitle>
                <DialogDescription>
                  Essa ação remove a comanda e devolve os itens ao estoque. Não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>

              {stockError && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{stockError}</p>}

              <DialogFooter className="flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onCancelDialogOpenChange(false)}
                  disabled={isCancelling}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={onConfirmCancelOrder}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelando..." : "Cancelar comanda"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isJuntoComDialogOpen} onOpenChange={onJuntoComDialogOpenChange}>
            <DialogContent className="sm:max-w-sm" onInteractOutside={(event) => event.preventDefault()}>
              <DialogHeader className="flex flex-col gap-0.5">
                <DialogTitle>Junto com</DialogTitle>
                <DialogDescription>
                  Adicione o nome de quem está junto — os itens que você adicionar a partir de agora vão pro pedido dela, e as
                  duas comandas são enviadas e impressas juntas pra cozinha, mas com pagamento separado.
                </DialogDescription>
              </DialogHeader>

              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  autoFocus
                  placeholder="Nome do cliente"
                  className="pl-9"
                  value={juntoComNameDraft}
                  onChange={(event) => onJuntoComNameDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && juntoComNameDraft.trim()) {
                      event.preventDefault();

                      onConfirmJuntoComName();
                    }
                  }}
                />
              </div>

              <DialogFooter className="flex-row gap-2">
                {hasSecondaryCart && (
                  <Button type="button" variant="outline" className="flex-1" onClick={onRemoveJuntoCom}>
                    Remover
                  </Button>
                )}

                <Button className="flex-1" onClick={onConfirmJuntoComName} disabled={!juntoComNameDraft.trim()}>
                  {hasSecondaryCart ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <EditOrderDialog
            open={isEditOrderDialogOpen}
            onOpenChange={onEditOrderDialogOpenChange}
            order={order}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryClick={onCategoryClick}
            filteredProducts={filteredProducts}
            products={products}
            supplyItems={supplyItems}
            onAddProduct={onAddProduct}
            onRemoveItem={onRemoveItem}
            isRemovingItem={isRemovingItem}
            stockError={stockError}
            onResendFullOrder={onResendFullOrder}
            isResendingFullOrder={isResendingFullOrder}
            onRequestCancelOrder={() => {
              onEditOrderDialogOpenChange(false);
              onRequestCancelOrder();
            }}
          />
        </div>
      )}
    </div>
  );
}
