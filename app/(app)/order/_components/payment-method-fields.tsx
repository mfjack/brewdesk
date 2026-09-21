import Image from "next/image";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import { formatCurrency } from "@/_lib/format-currency";
import { formatDateTime } from "@/_lib/format-date";
import { computeChangeDue } from "../order-math";
import { paymentMethodOptions } from "../payment-methods";
import type { TOrderResponse, TPaymentMethod } from "../interface";

interface TPaymentMethodFields {
  paymentMethod: TPaymentMethod;
  onPaymentMethodChange: (method: TPaymentMethod) => void;
  amountReceived: string;
  onAmountReceivedChange: (value: string) => void;
  total: number;
  pixQrCodeUrl?: string | null;
  methods?: typeof paymentMethodOptions;
  fiadoCustomerName?: string;
  onFiadoCustomerNameChange?: (value: string) => void;
  openFiadoMatches?: TOrderResponse[];
  fiadoTargetOrderId?: number | null;
  onFiadoTargetOrderIdChange?: (orderId: number | null) => void;
}

export function PaymentMethodFields({
  paymentMethod,
  onPaymentMethodChange,
  amountReceived,
  onAmountReceivedChange,
  total,
  pixQrCodeUrl,
  methods = paymentMethodOptions,
  fiadoCustomerName,
  onFiadoCustomerNameChange,
  openFiadoMatches = [],
  fiadoTargetOrderId,
  onFiadoTargetOrderIdChange,
}: TPaymentMethodFields) {
  const changeDue = paymentMethod === "CASH" && amountReceived ? computeChangeDue(Number(amountReceived), total) : null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Forma de pagamento</p>

      <div className="grid grid-cols-3 gap-1.5">
        {methods.map(({ value, label, Icon }) => (
          <Button
            key={value}
            type="button"
            size="lg"
            variant={paymentMethod === value ? "default" : "outline"}
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

      {paymentMethod === "FIADO" && (
        <div className="space-y-1">
          <Input
            placeholder="Nome do cliente"
            value={fiadoCustomerName ?? ""}
            onChange={(e) => onFiadoCustomerNameChange?.(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Necessário pra saber quem deve pagar depois.</p>

          {openFiadoMatches.length > 0 && (
            <div className="space-y-1 pt-1">
              <label className="text-xs font-medium">Adicionar a qual comanda?</label>
              <Select
                value={fiadoTargetOrderId ? String(fiadoTargetOrderId) : "new"}
                onValueChange={(value) => onFiadoTargetOrderIdChange?.(value === "new" ? null : Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nova comanda</SelectItem>
                  {openFiadoMatches.map((order) => (
                    <SelectItem key={order.id} value={String(order.id)}>
                      Aberta em {formatDateTime(order.createdAt)} — {formatCurrency(order.total)} em aberto
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Já existe comanda fiado nesse nome. Se for a mesma pessoa, escolha ela; se for outra, deixe em &quot;Nova
                comanda&quot;.
              </p>
            </div>
          )}
        </div>
      )}

      {paymentMethod === "PIX" && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4">
          {pixQrCodeUrl ? (
            <>
              <Image src={pixQrCodeUrl} alt="QR Code Pix" width={200} height={200} className="h-48 w-48 object-contain" />
              <p className="text-xs text-muted-foreground text-center">Peça pro cliente escanear o QR Code com o app do banco.</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center">Nenhum QR Code cadastrado. Configure em Configurações.</p>
          )}
        </div>
      )}
    </div>
  );
}
