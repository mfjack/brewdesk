import { formatCurrency } from "@/_lib/format-currency";

import { TOrderResponse } from "../interface";

interface TOrderReceipt {
  order: TOrderResponse;

  observation?: string;

  printMode?: "full" | "additional" | null;

  printedItemQuantities?: Record<number, number>;
}

export function OrderReceipt({ order, observation, printMode, printedItemQuantities = {} }: TOrderReceipt) {
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
      <h1 className="text-base font-bold text-center my-2">Mañana Café y Coisinhas</h1>

      <div className="border-b pb-2 mb-2 text-start">
        <p className="text-xs">CNPJ: 64.490.426/0001-53</p>

        <p className="text-xs">Avenida José Passos de Souza Junior, 3655</p>

        <p className="text-xs">Praia do Pecado - Macaé/RJ</p>
      </div>

      <div className="border-b pb-2 mb-2 text-xs">
        <p>Data: {new Date(order.createdAt).toLocaleString("pt-BR")}</p>

        <p>
          Cliente: <strong className="text-base">{order.customerName || "Sem nome"}</strong>
        </p>

        {receiptObservation && (
          <p>
            Observação: <strong>{receiptObservation}</strong>
          </p>
        )}
      </div>

      <div className="space-y-1">
        {displayItems.map((item) => (
          <div key={item.id} className="flex justify-between text-xs font-semibold">
            <span>
              {item.quantity}x {item.product.name}
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
    </div>
  );
}
