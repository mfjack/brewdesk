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
  onEditOrder?: () => void;
  requirePaymentMethod?: boolean;
  error?: string | null;

  paymentMethod: TPaymentMethod | null;
  onPaymentMethodChange: (method: TPaymentMethod) => void;
  amountReceived: string;
  onAmountReceivedChange: (value: string) => void;

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
  onEditOrder,
  requirePaymentMethod = false,
  error,

  paymentMethod,
  onPaymentMethodChange,
  amountReceived,
  onAmountReceivedChange,

  isSplitOpen,
  onSplitOpenChange,
  onConfirmSplitPayment,

  onConfirmPayment,
  isConfirmingPayment,
}: TPaymentDialog) {
  const { data: settings } = useGetSettings();

  const isSplitBillEnabled = settings?.featureFlags.splitBill ?? true;

  const availablePaymentMethods = paymentMethodOptions.filter((option) => option.value !== "CONTA");

  const finalTotal = order?.total ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
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

              <div className="max-h-64 space-y-1.5 overflow-y-auto no-scrollbar pr-0.5">
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

            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

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
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={onPaymentMethodChange}
                  amountReceived={amountReceived}
                  onAmountReceivedChange={onAmountReceivedChange}
                  total={finalTotal}
                  pixQrCodeUrl={settings?.pixQrCodeUrl}
                  methods={availablePaymentMethods}
                />

                <Separator className="mt-2" />

                <DialogFooter className="flex-row gap-2 mt-12">
                  <Button
                    className="flex-1"
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => onOpenChange(false)}
                    disabled={isConfirmingPayment}
                  >
                    Cancelar
                  </Button>

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
                      (requirePaymentMethod && paymentMethod === null) ||
                      (paymentMethod === "CASH" && Number(amountReceived) < finalTotal)
                    }
                  >
                    <DollarSign />
                    {isConfirmingPayment
                      ? "Processando..."
                      : paymentMethod === null && !requirePaymentMethod
                        ? "Abrir comanda"
                        : "Pagamento recebido"}
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
