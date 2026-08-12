import { formatCurrency } from "@/_lib/format-currency";
import { TOrderResponse } from "../interface";

interface TOrderReceipt {
  order: TOrderResponse;
  observation?: string;
}

export function OrderReceipt({ order, observation }: TOrderReceipt) {
  return (
    <div className="order-receipt hidden print:block px-2 h-fit">
      <h1 className="text-base font-bold text-center my-2">Mañana Café y Coisinhas</h1>
      <div className="border-b pb-2 mb-2 text-start">
        <p className="text-xs">CNPJ: 64.490.426/0001-53</p>

        <p className="text-xs">Avenida José Passos de Souza Junior, 3655</p>

        <p className="text-xs">Praia do Pecado - Macaé/RJ</p>
      </div>

      <div className="border-b pb-2 mb-2 text-xs">
        <p>Data: {new Date(order.createdAt).toLocaleString("pt-BR")}</p>

        <p>
          Cliente: <strong className="text-base">{order.customerName}</strong>
        </p>

        {observation && (
          <p>
            Observação: <strong>{observation}</strong>
          </p>
        )}
      </div>

      <div className="space-y-1">
        {order.orderItems?.map((item) => (
          <div key={item.id} className="flex justify-between text-xs font-semibold">
            <span>
              {item.quantity}x {item.product.name}
            </span>

            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>

      <div className="border-t mt-3 pt-2 flex justify-between font-bold">
        <span>Total</span>
        <span>{formatCurrency(order.total)}</span>
      </div>
    </div>
  );
}
