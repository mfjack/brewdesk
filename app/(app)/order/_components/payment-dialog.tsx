import { DollarSign } from "lucide-react";

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
import { useGetSumupStatus } from "../query/useGetSumupStatus";
import type { TOrderPayment, TOrderResponse, TPaymentMethod } from "../interface";
import type { TSumupChargeState } from "@/_lib/sumup/client";

export interface TPaymentDialog {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: TOrderResponse | null;
  description?: string;

  paymentMethod: TPaymentMethod;
  onPaymentMethodChange: (method: TPaymentMethod) => void;
  amountReceived: string;
  onAmountReceivedChange: (value: string) => void;

  fiadoCustomerName: string;
  onFiadoCustomerNameChange: (value: string) => void;
  openFiadoMatches?: TOrderResponse[];
  fiadoTargetOrderId?: number | null;
  onFiadoTargetOrderIdChange?: (orderId: number | null) => void;

  sumupCardType?: "credit" | "debit";
  onSumupCardTypeChange?: (cardType: "credit" | "debit") => void;
  sumupChargeState?: TSumupChargeState;
  sumupChargeError?: string | null;

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

  paymentMethod,
  onPaymentMethodChange,
  amountReceived,
  onAmountReceivedChange,

  fiadoCustomerName,
  onFiadoCustomerNameChange,
  openFiadoMatches,
  fiadoTargetOrderId,
  onFiadoTargetOrderIdChange,

  sumupCardType,
  onSumupCardTypeChange,
  sumupChargeState,
  sumupChargeError,

  isSplitOpen,
  onSplitOpenChange,
  onConfirmSplitPayment,

  onConfirmPayment,
  isConfirmingPayment,
}: TPaymentDialog) {
  const { data: settings } = useGetSettings();
  const { data: sumupStatus } = useGetSumupStatus();

  const isSplitBillEnabled = settings?.featureFlags.splitBill ?? true;
  const isCreditSaleEnabled = settings?.featureFlags.creditSale ?? false;
  const supportsSumup = Boolean(onSumupCardTypeChange);
  const isSumupPaired = supportsSumup && sumupStatus?.readerStatus === "paired";

  const availablePaymentMethods = paymentMethodOptions.filter((option) => {
    if (option.value === "FIADO") {
      return isCreditSaleEnabled;
    }

    if (option.value === "SUMUP") {
      return isSumupPaired;
    }

    if ((option.value === "CREDIT" || option.value === "DEBIT") && isSumupPaired) {
      return false;
    }

    return true;
  });

  const finalTotal = order?.total ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader className="flex flex-col gap-0.5">
          <DialogTitle>Confirmar pagamento</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-6">
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
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={onPaymentMethodChange}
                  amountReceived={amountReceived}
                  onAmountReceivedChange={onAmountReceivedChange}
                  total={finalTotal}
                  pixQrCodeUrl={settings?.pixQrCodeUrl}
                  methods={availablePaymentMethods}
                  fiadoCustomerName={fiadoCustomerName}
                  onFiadoCustomerNameChange={onFiadoCustomerNameChange}
                  openFiadoMatches={openFiadoMatches}
                  fiadoTargetOrderId={fiadoTargetOrderId}
                  onFiadoTargetOrderIdChange={onFiadoTargetOrderIdChange}
                  sumupCardType={sumupCardType}
                  onSumupCardTypeChange={onSumupCardTypeChange}
                />

                {paymentMethod === "SUMUP" && (sumupChargeState === "waiting" || sumupChargeState === "charging") && (
                  <p className="rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
                    Aguardando pagamento na maquininha...
                  </p>
                )}

                {paymentMethod === "SUMUP" && sumupChargeState === "failed" && sumupChargeError && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                    {sumupChargeError}
                  </p>
                )}

                <DialogFooter>
                  <Button
                    className="w-full"
                    type="button"
                    size="lg"
                    onClick={onConfirmPayment}
                    disabled={
                      isConfirmingPayment ||
                      (paymentMethod === "CASH" && Number(amountReceived) < finalTotal) ||
                      (paymentMethod === "FIADO" && !fiadoCustomerName.trim()) ||
                      (paymentMethod === "SUMUP" && (sumupChargeState === "charging" || sumupChargeState === "waiting"))
                    }
                  >
                    <DollarSign />
                    {paymentMethod === "SUMUP"
                      ? sumupChargeState === "charging" || sumupChargeState === "waiting"
                        ? "Aguardando..."
                        : "Cobrar na maquininha"
                      : isConfirmingPayment
                        ? "Processando..."
                        : paymentMethod === "FIADO"
                          ? fiadoTargetOrderId != null
                            ? "Adicionar à comanda fiado"
                            : "Registrar fiado"
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
