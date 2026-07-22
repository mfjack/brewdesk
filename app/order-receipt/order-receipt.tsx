import { formatCurrency } from "@/_lib/format-currency";
import { TOrderResponse } from "../order/interface";

interface TOrderReceipt {
   order: TOrderResponse;
   observation?: string;
}

export function OrderReceipt({ order, observation }: TOrderReceipt) {
   return (
      <div className="order-receipt hidden print:block w-full p-6 space-y-6">
         <div>
            <h1 className="font-bold text-xl text-center pb-2">Mañana Café y Coisinhas</h1>
            <p>CNPJ: 64.490.426/0001-53</p>
            <p>Avenida José Passos de Souza Junior, 3655 Praia do Pecado - Macaé/RJ</p>
         </div>
         <div>
            <p>Data: {new Date(order.createdAt).toLocaleString("pt-BR")}</p>
            <p>
               Cliente: <span className="font-bold">{order.customerName}</span>
            </p>
            {observation && (
               <div className="w-full flex flex-wrap">
                  <p>
                     Observação: <span className="font-bold">{observation}</span>
                  </p>
               </div>
            )}
         </div>
         <div className="space-y-1">
            {order.orderItems?.map((item) => (
               <div key={item.id} className="flex justify-between items-center w-full font-bold text-base">
                  <span>
                     {item.quantity} {item.product.name}
                  </span>
                  <span>{formatCurrency(item.subtotal)}</span>
               </div>
            ))}
         </div>
         <div className="flex justify-between w-full text-base">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
         </div>
      </div>
   );
}
