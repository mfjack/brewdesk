"use client";

import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Separator } from "@/_components/ui/separator";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useGetOrder } from "../kitchen/query/useGetOrder";
import { TOrderResponse } from "../order/interface";
import { useDeleteOrder } from "./mutation/useDeleteOrder";
import { formatCurrency } from "@/_lib/format-currency";

export default function OrderDetailPage() {
   const { data: orders = [] } = useGetOrder();
   const deleteOrder = useDeleteOrder();

   function handleDeleteOrder(orderId: number) {
      deleteOrder.mutate({ orderId });
   }

   return (
      <section className="flex flex-col h-screen w-full">
         <div className="flex flex-col p-4 w-full">
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="text-2xl font-bold">Comandas</h1>
                  <p className="text-sm text-muted-foreground">Comandas em aberto.</p>
               </div>
               <Button asChild size="lg">
                  <Link href="/order">
                     <Plus />
                     Nova comanda
                  </Link>
               </Button>
            </div>
         </div>
         <Separator className="h-px bg-border" />

         {orders.length === 0 ? (
            <p className="p-4 text-base text-muted-foreground">Nenhuma comanda em aberto.</p>
         ) : (
            <div className="flex-1 overflow-auto p-4 [&::-webkit-scrollbar]:hidden">
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {orders.map((order: TOrderResponse) => (
                     <Card className="flex flex-col gap-8 p-4 justify-between" key={order.id}>
                        <div className="flex flex-wrap justify-between gap-1">
                           <div className="flex gap-2 items-center">
                              <span className="font-bold text-sm">{order.customerName}</span>
                              <span className="text-foreground text-xs">#{order.id}</span>
                           </div>

                           <span className="text-foreground text-sm font-bold">{formatCurrency(order.total)}</span>
                        </div>

                        <Button onClick={() => handleDeleteOrder(order.id)}>Fechar comanda</Button>
                     </Card>
                  ))}
               </div>
            </div>
         )}
      </section>
   );
}
