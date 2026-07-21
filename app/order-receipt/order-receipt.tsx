import { formatCurrency } from "@/_lib/format-currency";
import { TOrderResponse } from "../order/interface";

interface TOrderReceipt {
  order: TOrderResponse;
  observation?: string;
}

export function OrderReceipt({ order, observation }: TOrderReceipt) {
  return (
    <div className="order-receipt hidden print:block text-black font-mono w-full bg-white h-fit">
      <div className="flex flex-col justify-center items-start w-full">
        <h1 className="text-center font-medium text-xl">Mañana Café y Coisinhas</h1>
        <span className="text-center text-xs w-full">-------------------------------</span>
        <div>
          <p>Data: {new Date(order.createdAt).toLocaleString("pt-BR")}</p>
          <p>
            Cliente: <span className="font-bold">{order.customerName}</span>
          </p>
          {observation && (
            <>
              <div className="w-full flex flex-wrap">
                <p>Observação:</p>
                <p className="font-bold">{observation}</p>
              </div>
            </>
          )}
        </div>
        <span className="text-center text-xs w-full">-------------------------------</span>
        <div className="w-full flex flex-col gap-2">
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex justify-between items-center w-full font-bold font-mono">
              <span className="text-xl">
                {item.quantity} {item.product.name}
              </span>
              {/* <span className="text-xs">{formatCurrency(item.subtotal)}</span> */}
            </div>
          ))}
        </div>
        <span className="text-center text-xs w-full">-------------------------------</span>
        <div className="flex justify-between w-full">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
