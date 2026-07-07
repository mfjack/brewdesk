import { ShoppingBag, Send } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Card } from "@/_components/ui/card";
import { TMenuList, TOrderItem, TOrderResponse } from "../types";

export function MenuList({ order, onRemoveItem, onSendOrder, isSending, isRemovingItem }: TMenuList) {
   const formatCurrency = (value: number) =>
      new Intl.NumberFormat("pt-BR", {
         style: "currency",
         currency: "BRL",
      }).format(value);

   return (
      <div className="h-screen w-1/2">
         <div className="flex flex-col h-full">
            {!order ? (
               <div className="flex flex-col items-center justify-center gap-2 px-5 text-center h-full">
                  <ShoppingBag className="size-6" />
                  <p className="text-sm font-medium">Nenhuma comanda aberta</p>
                  <p className="text-xs text-muted-foreground text-pretty">
                     Digite o nome do cliente e abra a comanda para começar a adicionar itens.
                  </p>
               </div>
            ) : (
               <>
                  <p className="p-4 text-sm text-muted-foreground">
                     Comanda de <span className="font-bold">{order.customerName}</span>
                  </p>

                  <Separator className="h-px bg-border" />

                  <div className="flex-1 flex-col gap-4 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                     {order.orderItems.length === 0 ? (
                        <p className="flex h-full justify-center items-center text-sm text-muted-foreground">
                           Adicione itens do cardápio à comanda.
                        </p>
                     ) : (
                        <div className="flex flex-col gap-3">
                           {order.orderItems.map((item: TOrderItem) => (
                              <Card key={item.id} className="flex flex-row items-center justify-between p-4 mb-3">
                                 <div className="flex items-center gap-6">
                                    <span className="text-sm font-bold">{item.quantity}</span>

                                    <div className="flex flex-col items-start">
                                       <p className="text-sm font-bold">{item.product.name}</p>
                                       <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</p>
                                    </div>
                                 </div>

                                 <Button size="sm" onClick={() => onRemoveItem(item.id)} disabled={isRemovingItem}>
                                    Remover
                                 </Button>
                              </Card>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="flex flex-row items-center justify-between p-4 w-full">
                     <p className="px-4 py-2 text-lg font-bold">Total: </p>
                     <span className="px-4 py-2 text-lg font-bold">{formatCurrency(order.total)}</span>
                  </div>

                  <Button className="mx-4 mb-4" size="lg" onClick={onSendOrder} disabled={isSending || order.orderItems.length === 0}>
                     <Send />
                     Enviar pedido
                  </Button>
               </>
            )}
         </div>
      </div>
   );
}
