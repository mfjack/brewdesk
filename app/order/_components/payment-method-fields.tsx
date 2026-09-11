import Image from "next/image";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { formatCurrency } from "@/_lib/format-currency";
import { computeChangeDue } from "../order-math";
import { paymentMethodOptions } from "../payment-methods";
import type { TPaymentMethod } from "../interface";

interface TPaymentMethodFields {
  paymentMethod: TPaymentMethod;
  onPaymentMethodChange: (method: TPaymentMethod) => void;
  amountReceived: string;
  onAmountReceivedChange: (value: string) => void;
  total: number;
  pixQrCodeUrl?: string | null;
}

export function PaymentMethodFields({
  paymentMethod,
  onPaymentMethodChange,
  amountReceived,
  onAmountReceivedChange,
  total,
  pixQrCodeUrl,
}: TPaymentMethodFields) {
  const changeDue = paymentMethod === "CASH" && amountReceived ? computeChangeDue(Number(amountReceived), total) : null;

  return (
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
          {pixQrCodeUrl ? (
            <>
              <Image src={pixQrCodeUrl} alt="QR Code Pix" width={200} height={200} className="h-48 w-48 object-contain" />
              <p className="text-xs text-muted-foreground text-center">
                Peça pro cliente escanear o QR Code com o app do banco.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center">Nenhum QR Code cadastrado. Configure em Configurações.</p>
          )}
        </div>
      )}
    </div>
  );
}
