import { ShoppingBag, Trash2, NotebookPen, Printer } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Card } from "@/_components/ui/card";
import { TMenuList, TOrderItem } from "../interface";
import { formatCurrency } from "@/_lib/format-currency";
import { Input } from "@/_components/ui/input";
import { OrderReceipt } from "@/app/order-receipt/order-receipt";

export function MenuList({ order, onRemoveItem, onSendOrder, isSending, isRemovingItem, observation, onObservationChange }: TMenuList) {
   return (
      <div className="h-screen w-1/2">
         {order && <OrderReceipt order={order} observation={observation} />}
         {order && (
            <div className="flex flex-col h-full">
               <p className="p-4 text-sm text-muted-foreground">
                  Comanda de <span className="font-bold">{order.customerName}</span>
               </p>

               <Separator className="h-px bg-border" />

               <div className="flex-1 flex-col gap-4 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                  {(order.orderItems?.length ?? 0) === 0 ? (
                     <p className="flex h-full justify-center items-center text-sm text-muted-foreground">
                        Adicione itens do cardápio à comanda.
                     </p>
                  ) : (
                     <div className="flex flex-col gap-1">
                        {order.orderItems.map((item: TOrderItem) => (
                           <Card key={item.id} className="flex flex-row items-center justify-between p-4 mb-3">
                              <div className="flex items-center gap-6">
                                 <span
                                    className="z-10 flex h-6 w-6 items-center justify-center
                    rounded-full bg-white text-xs font-bold text-black shadow"
                                 >
                                    {item.quantity}
                                 </span>

                                 <div className="flex flex-col items-start">
                                    <p className="text-sm font-bold">{item.product.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</p>
                                 </div>
                              </div>

                              <Button
                                 size="icon-lg"
                                 className="bg-white hover:bg-destructive/90"
                                 onClick={() => onRemoveItem(item.id)}
                                 disabled={isRemovingItem}
                              >
                                 <Trash2 className="text-destructive" />
                              </Button>
                           </Card>
                        ))}
                     </div>
                  )}
               </div>

               {order.observation && (
                  <p className="text-xs px-4 font-bold text-destructive">
                     Observação:
                     <span className="text-xs font-medium text-foreground"> {order.observation || "Nenhuma observação"}</span>
                  </p>
               )}

               <div className="relative flex items-center w-full px-4 mt-4">
                  <NotebookPen className="absolute left-7 h-4 w-4 text-muted-foreground" />
                  <Input
                     type="text"
                     placeholder="Adicionar observação..."
                     className="pl-9"
                     value={observation}
                     onChange={(e) => onObservationChange(e.target.value)}
                  />
               </div>

               <div className="flex flex-row items-center justify-between px-2 py-2 w-full">
                  <p className="px-4 py-2 text-lg font-bold">Total: </p>
                  <span className="px-4 py-2 text-lg font-bold">{formatCurrency(order.total ?? 0)}</span>{" "}
               </div>

               <Button
                  className="mx-4 mb-4 flex gap-3"
                  size="lg"
                  onClick={onSendOrder}
                  disabled={isSending || (order.orderItems?.length ?? 0) === 0}
               >
                  <Printer />
                  Imprimir comanda
               </Button>
            </div>
         )}
      </div>
   );
}
