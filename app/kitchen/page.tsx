"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/_components/ui/card";
import { Separator } from "@/_components/ui/separator";
import { useGetOrder } from "./query/useGetOrder";
import { TOrderResponse } from "../order/types";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { cn } from "@/_lib/utils";
import { useUpdateOrderStatus } from "../order/mutation/useUpdateOrderStatus";

export default function KitchenPage() {
   const queryClient = useQueryClient();
   const { data: orders = [] } = useGetOrder();
   const updateOrderStatus = useUpdateOrderStatus();

   const pendingOrders = orders.filter((order: TOrderResponse) => order.status === "PENDING");
   const inProgressOrders = orders.filter((order: TOrderResponse) => order.status === "IN_PROGRESS");
   const readyOrders = orders.filter((order: TOrderResponse) => order.status === "READY");

   const columns = [
      {
         title: "Pendente",
         orders: pendingOrders,
         badgeClassName: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
         emptyMessage: "Nenhum pedido pendente.",
         actionLabel: "Iniciar Preparo",
      },
      {
         title: "Preparando",
         orders: inProgressOrders,
         badgeClassName: "bg-blue-500/15 text-blue-500 border-blue-500/20",
         emptyMessage: "Nenhum pedido em preparo.",
         actionLabel: "Marcar como pronto",
      },
      {
         title: "Pronto",
         orders: readyOrders,
         badgeClassName: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
         emptyMessage: "Nenhum pedido pronto.",
         actionLabel: "Entregue",
      },
   ] as const;

   function getStatusLabel(status: TOrderResponse["status"]) {
      if (status === "PENDING") {
         return "Pendente";
      }

      if (status === "IN_PROGRESS") {
         return "Preparando";
      }

      if (status === "DELIVERED") {
         return "Entregue";
      }

      return "Pronto";
   }

   async function handleAdvanceStatus(order: TOrderResponse) {
      const nextStatus = order.status === "PENDING" ? "IN_PROGRESS" : order.status === "IN_PROGRESS" ? "READY" : "DELIVERED";

      await updateOrderStatus.mutateAsync({
         orderId: order.id,
         status: nextStatus,
      });

      await queryClient.invalidateQueries({ queryKey: ["order"] });
   }

   return (
      <section className="flex flex-col h-screen">
         <div className="flex flex-col p-4">
            <h1 className="text-xl font-bold">Cozinha</h1>
            <p className="text-sm text-muted-foreground">Gerencie os pedidos recebidos.</p>
         </div>

         <Separator className="h-px w-full" />

         <div className="grid flex-1 grid-cols-3 gap-4 p-4 md:grid-cols-3 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {columns.map((column) => (
               <div key={column.title} className="flex flex-col gap-4 ">
                  <div className="flex items-center gap-2">
                     <span className="h-3 w-3 rounded-full bg-current" />
                     <h2 className="text-lg font-bold">{column.title}</h2>
                     <span className="text-sm text-muted-foreground">({column.orders.length})</span>
                  </div>

                  <div className="flex flex-col gap-4 ">
                     {column.orders.length === 0 ? (
                        <Card className="p-4 text-sm text-muted-foreground">{column.emptyMessage}</Card>
                     ) : (
                        column.orders.map((order: TOrderResponse) => (
                           <Card key={order.id} className="flex flex-col gap-2 p-4">
                              <div className="flex justify-between gap-2">
                                 <div className="flex gap-2 items-center">
                                    <span className="font-bold text-lg">{order.customerName}</span>
                                    <span className="text-foreground">#{order.id}</span>
                                 </div>

                                 <Badge className={column.badgeClassName}>{getStatusLabel(order.status)}</Badge>
                              </div>

                              {order.orderItems.length > 0 && (
                                 <div className="flex flex-col gap-2">
                                    {order.orderItems.map((item: TOrderResponse["orderItems"][number]) => (
                                       <div key={item.id} className="flex flex-row gap-2">
                                          <span className="text-base">{item.quantity}</span>
                                          <span className="text-base">{item.product.name}</span>
                                       </div>
                                    ))}
                                 </div>
                              )}

                              <Button size={"lg"} onClick={() => handleAdvanceStatus(order)} disabled={updateOrderStatus.isPending}>
                                 {column.actionLabel}
                              </Button>
                           </Card>
                        ))
                     )}
                  </div>
               </div>
            ))}
         </div>
      </section>
   );
}
