"use client";

import { useState } from "react";
import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { HandCoins, Plus, X } from "lucide-react";
import Link from "next/link";
import { useGetOrder } from "../kitchen/query/useGetOrder";
import { TOrderResponse } from "../order/interface";
import { useDeleteOrder } from "./mutation/useDeleteOrder";
import { formatCurrency } from "@/_lib/format-currency";
import { Header } from "@/_components/ui/header";

export default function OrderDetailPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: orders = [] } = useGetOrder();

  const filteredOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((order) => order.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

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

      <div className="p-4 flex gap-2 w-100">
        <Input
          type="text"
          placeholder="Filtrar por nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        {searchTerm && (
          <Button size="icon" variant="ghost" onClick={() => setSearchTerm("")} className="h-10 w-10">
            <X size={16} />
          </Button>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="p-4 text-base text-muted-foreground">Nenhuma comanda em aberto.</p>
      ) : filteredOrders.length === 0 ? (
        <p className="p-4 text-base text-muted-foreground">Nenhuma comanda encontrada com esse nome.</p>
      ) : (
        <div className="flex-1 overflow-auto p-4 [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredOrders.map((order: TOrderResponse) => (
              <Card className="flex flex-col gap-3 p-4 justify-between" key={order.id}>
                <div className="flex flex-wrap justify-between gap-1">
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-sm">{order.customerName}</span>
                    <span className="font-medium text-sm text-muted-foreground">#{order.id}</span>
                  </div>

                  <span className="text-muted-foreground text-sm font-bold">{formatCurrency(order.total)}</span>
                </div>

                {order.observation && (
                  <p className="text-xs font-bold text-destructive">
                    Observação:
                    <span className="text-xs font-medium text-foreground"> {order.observation || "Nenhuma observação"}</span>
                  </p>
                )}

                <Button asChild className="w-full mt-4" size="lg" variant="default">
                  <Link href={`/order?orderId=${order.id}`}>Detalhes da comanda</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
