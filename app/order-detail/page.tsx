"use client";

import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Separator } from "@/_components/ui/separator";
import { HandCoins, Plus } from "lucide-react";
import Link from "next/link";
import { useGetOrder } from "../kitchen/query/useGetOrder";
import { TOrderResponse } from "../order/interface";
import { useDeleteOrder } from "./mutation/useDeleteOrder";
import { formatCurrency } from "@/_lib/format-currency";
import { Header } from "@/_components/ui/header";

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
          <Header title="Comandas" description="Gerencie as comandas: visualize, abra e feche comandas." />
          <Button asChild size="lg" className="w-30">
            <Link href="/order">
              <HandCoins />
              <p>PDV</p>
            </Link>
          </Button>
        </div>
      </div>
      <Separator className="h-px bg-border" />

      {orders.length === 0 ? (
        <p className="p-4 text-base text-muted-foreground">Nenhuma comanda em aberto.</p>
      ) : (
        <div className="flex-1 overflow-auto p-4 [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {orders.map((order: TOrderResponse) => (
              <Card className="flex flex-col gap-4 p-4 justify-between" key={order.id}>
                <div className="flex flex-wrap justify-between gap-1">
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-sm">{order.customerName}</span>
                    <span className="font-medium text-sm text-foreground">#{order.id}</span>
                  </div>

                  <span className="text-foreground text-sm font-bold">{formatCurrency(order.total)}</span>
                </div>

                {order.observation && (
                  <p className="text-xs font-bold text-destructive">
                    Observação:
                    <span className="text-xs font-medium text-foreground"> {order.observation || "Nenhuma observação"}</span>
                  </p>
                )}

                <div className="flex flex-col w-full justify-center items-center gap-3">
                  <Button asChild className="w-full" size="lg" variant="default">
                    <Link href={`/order?orderId=${order.id}`}>Detalhes da comanda</Link>
                  </Button>
                  <Button className="w-full" size="lg" variant="secondary" onClick={() => handleDeleteOrder(order.id)}>
                    Fechar comanda
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
