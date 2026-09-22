import { DollarSign, Pencil } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { PaymentMethodFields } from "./payment-method-fields";
import { SplitBillCalculator } from "./split-bill-calculator";
import { paymentMethodOptions } from "../payment-methods";
import { getChargedTakeoutFee } from "../order-math";
import { formatCurrency } from "@/_lib/format-currency";
import { toTitleCase } from "@/_lib/to-title-case";
import { useGetSettings } from "@/app/(app)/settings/query/useGetSettings";
import type { TOrderPayment, TOrderResponse, TPaymentMethod } from "../interface";

export interface TPaymentDialog {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: TOrderResponse | null;
  description?: string;
  disableSplit?: boolean;
  onEditOrder?: () => void;

  paymentMethod: TPaymentMethod | null;
  onPaymentMethodChange: (method: TPaymentMethod) => void;
  amountReceived: string;
  onAmountReceivedChange: (value: string) => void;

  contaCustomerName: string;
  openContaMatches?: TOrderResponse[];
  contaTargetOrderId?: number | null;
  onContaTargetOrderIdChange?: (orderId: number | null) => void;

  isSplitOpen: boolean;
  onSplitOpenChange: (open: boolean) => void;
  onConfirmSplitPayment: (payments: TOrderPayment[]) => void | Promise<void>;

  onConfirmPayment: () => void;
  isConfirmingPayment: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  order,
  description = "Confirme o recebimento do pagamento da comanda.",
  disableSplit = false,
  onEditOrder,

  paymentMethod,
  onPaymentMethodChange,
  amountReceived,
  onAmountReceivedChange,

  contaCustomerName,
  openContaMatches,
  contaTargetOrderId,
  onContaTargetOrderIdChange,

  isSplitOpen,
  onSplitOpenChange,
  onConfirmSplitPayment,

  onConfirmPayment,
  isConfirmingPayment,
}: TPaymentDialog) {
  const { data: settings } = useGetSettings();

  const isSplitBillEnabled = (settings?.featureFlags.splitBill ?? true) && !disableSplit;
  const isCreditSaleEnabled = settings?.featureFlags.creditSale ?? false;

  const availablePaymentMethods = paymentMethodOptions.filter((option) => option.value !== "CONTA");

  // No method pressed yet: falls back to "conta" (pay later) when that's enabled, otherwise
  // stays unresolved so the operator has to make an explicit choice. The customer name for
  // that path is already collected upfront (same "Quem é o cliente?" dialog used to send the
  // order), so it doesn't need to be asked again here.
  const effectiveMethod: TPaymentMethod | null = paymentMethod ?? (isCreditSaleEnabled ? "CONTA" : null);

  const finalTotal = order?.total ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader className="flex flex-col gap-0.5">
          <DialogTitle>Confirmar pagamento</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-1">
                <p className="text-sm text-muted-foreground">Cliente: </p>
                <p className="font-bold text-sm">{toTitleCase(order.customerName)}</p>
              </div>

              <div className="space-y-1.5">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold">{item.quantity}x</span>
                      <span>{toTitleCase(item.product.name)}</span>
                    </div>

                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}

                {order.isTakeout && (
                  <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>Embalagem para levar</span>
                    <span className="font-medium">{formatCurrency(getChargedTakeoutFee(order))}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            {isSplitBillEnabled && (
              <SplitBillCalculator
                order={order}
                isOpen={isSplitOpen}
                onOpenChange={onSplitOpenChange}
                pixQrCodeUrl={settings?.pixQrCodeUrl}
                onConfirmSplitPayment={onConfirmSplitPayment}
                isConfirming={isConfirmingPayment}
              />
            )}

            {!isSplitOpen && (
              <>
                <Separator />

                <PaymentMethodFields
                  paymentMethod={effectiveMethod}
                  onPaymentMethodChange={onPaymentMethodChange}
                  amountReceived={amountReceived}
                  onAmountReceivedChange={onAmountReceivedChange}
                  total={finalTotal}
                  pixQrCodeUrl={settings?.pixQrCodeUrl}
                  methods={availablePaymentMethods}
                  openContaMatches={openContaMatches}
                  contaTargetOrderId={contaTargetOrderId}
                  onContaTargetOrderIdChange={onContaTargetOrderIdChange}
                />

                <Separator className="mt-2" />

                <DialogFooter className="flex-row gap-2 mt-12">
                  {onEditOrder && (
                    <Button className="flex-1" type="button" variant="outline" size="lg" onClick={onEditOrder}>
                      <Pencil />
                      Alterar pedido
                    </Button>
                  )}

                  <Button
                    className="flex-1"
                    type="button"
                    size="lg"
                    onClick={onConfirmPayment}
                    disabled={
                      isConfirmingPayment ||
                      effectiveMethod === null ||
                      (effectiveMethod === "CASH" && Number(amountReceived) < finalTotal) ||
                      (effectiveMethod === "CONTA" && !contaCustomerName.trim())
                    }
                  >
                    <DollarSign />
                    {isConfirmingPayment
                      ? "Processando..."
                      : effectiveMethod === "CONTA"
                        ? contaTargetOrderId != null
                          ? "Adicionar à comanda na conta"
                          : "Registrar conta"
                        : "Pagamento Recebido"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
