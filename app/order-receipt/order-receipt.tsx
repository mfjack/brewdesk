import { formatCurrency } from "@/_lib/format-currency";
import { TOrderResponse } from "../order/interface";

interface TOrderReceipt {
   order: TOrderResponse;
}

export function OrderReceipt({ order }: TOrderReceipt) {
   return (
      <div className="order-receipt hidden print:block text-black font-mono w-full bg-white h-fit">
         <div className="flex flex-col justify-center items-start w-full">
            <h1 className="text-center font-medium text-xl">Mañana Café y Coisinhas</h1>
            <span className="text-center text-xs w-full">-------------------------------</span>
            <div className="text-lg my-2">
               <p>Data: {new Date(order.createdAt).toLocaleString("pt-BR")}</p>
               <p>
                  Cliente: <span className="font-bold text-xl">{order.customerName}</span>
               </p>
            </div>
            <span className="text-center text-xs w-full">-------------------------------</span>
            <div className="my-4 w-full flex flex-col gap-2">
               {order.orderItems?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center w-full font-bold font-mono mt-2">
                     <span className="text-xl">
                        {item.quantity} {item.product.name}
                     </span>
                     {/* <span className="text-xs">{formatCurrency(item.subtotal)}</span> */}
                  </div>
               ))}
            </div>
            <span className="text-center text-xs w-full">-------------------------------</span>
            <div className="flex justify-between text-lg w-full mt-4">
               <span>Total</span>
               <span>{formatCurrency(order.total)}</span>
            </div>
         </div>
      </div>
   );
}
