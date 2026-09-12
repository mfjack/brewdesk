import { formatCurrency } from "@/_lib/format-currency";
import { formatDateTime } from "@/_lib/format-date";

import { TOrderResponse } from "../interface";
import { toTitleCase } from "@/_lib/to-title-case";
import { useGetSettings } from "@/app/settings/query/useGetSettings";

interface TOrderReceipt {
  order: TOrderResponse;

  observation?: string;

  printMode?: "full" | "additional" | null;

  printedItemQuantities?: Record<number, number>;
}

export function OrderReceipt({ order, observation, printMode, printedItemQuantities = {} }: TOrderReceipt) {
  const { data: settings } = useGetSettings();

  const isAdditional = printMode === "additional";

  const displayItems = isAdditional
    ? order.orderItems
        .map((item) => ({
          ...item,
          quantity: item.quantity - (printedItemQuantities[item.id] ?? 0),
        }))
        .filter((item) => item.quantity > 0)
    : order.orderItems;

  const shouldDisplay = printMode === "full" || (printMode === "additional" && displayItems.length > 0);

  if (!shouldDisplay) {
    return null;
  }

  const receiptObservation = order.observation ?? observation;

  return (
    <div className="order-receipt hidden px-2 h-fit print:block">
      <h1 className="text-base font-bold text-center my-2">{settings?.name}</h1>

      <div className="border-b pb-2 mb-2 text-start">
        {settings?.cnpj && <p className="text-xs">CNPJ: {settings.cnpj}</p>}

        {settings?.address?.split("\n").map((line, index) => (
          <p key={index} className="text-xs">
            {line}
          </p>
        ))}

        {settings?.phone && <p className="text-xs">Tel: {settings.phone}</p>}
      </div>

      <div className="border-b pb-2 mb-2 text-xs">
        <p>Data: {formatDateTime(order.createdAt)}</p>

        <p>
          Cliente: <span className="text-base font-medium uppercase">{order.customerName || "Sem nome"}</span>
        </p>

        {order.operatorName && <p>Atendente: {toTitleCase(order.operatorName)}</p>}

        {order.isTakeout && <p className="mt-1 text-center text-base font-bold">*** PARA LEVAR ***</p>}

        {receiptObservation && (
          <p>
            Observação: <strong>{receiptObservation}</strong>
          </p>
        )}
      </div>

      <div className="space-y-1">
        {displayItems.map((item) => (
          <div key={item.id} className="flex justify-between text-xs font-semibold">
            <span className="flex gap-1">
              {item.quantity}x <p>{toTitleCase(item.product.name)}</p>
            </span>

            <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
          </div>
        ))}
      </div>

      <div className="border-t mt-3 pt-2 flex justify-between font-bold text-xs">
        <span>{isAdditional ? "Subtotal Adicionais" : "Total"}</span>

        <span>
          {formatCurrency(
            isAdditional ? displayItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) : order.total,
          )}
        </span>
      </div>

      {settings?.receiptFooterMessage && <p className="mt-3 text-center text-xs">{settings.receiptFooterMessage}</p>}
    </div>
  );
}
