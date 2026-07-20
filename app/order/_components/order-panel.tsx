import { useState } from "react";

import { Button } from "@/_components/ui/button";
import { Card, CardContent, CardTitle } from "@/_components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { formatCurrency } from "@/_lib/format-currency";
import { TCategory, TOrderPanel, TProduct } from "../interface";
import { Plus, ScrollText } from "lucide-react";
import { Header } from "@/_components/ui/header";
import Link from "next/link";

export function OrderPanel({
  categories,
  selectedCategory,
  handleCategoryClick,
  customerName,
  onCustomerNameChange,
  onOpenOrder,
  hasActiveOrder,
  filteredProducts,
  onAddProduct,
  order,
}: TOrderPanel) {
  const [isOpenOrderDialogOpen, setIsOpenOrderDialogOpen] = useState(false);

  function handleConfirmOpenOrder() {
    onOpenOrder();
    setIsOpenOrderDialogOpen(false);
  }

  return (
    <section className="flex flex-col h-screen w-full">
      <div className="flex flex-col p-4 w-full">
        <div className="flex items-center justify-between">
          <Header title="PDV" description="Gerencie pedidos: crie pedidos, adicione e remova produtos." />
          <div className="flex gap-3">
            <Button variant="secondary" asChild size="lg">
              <Link href="/order-detail">
                <ScrollText />
                Comandas
              </Link>
            </Button>
            <Button size="lg" onClick={() => setIsOpenOrderDialogOpen(true)}>
              <Plus />
              Novo pedido
            </Button>
          </div>
        </div>

        <form>
          <Dialog open={isOpenOrderDialogOpen} onOpenChange={setIsOpenOrderDialogOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Novo pedido</DialogTitle>
                <DialogDescription>Digite o nome do cliente para iniciar o atendimento.</DialogDescription>
                <Input
                  type="text"
                  placeholder="Nome do cliente"
                  value={customerName}
                  onChange={(event) => onCustomerNameChange(event.target.value)}
                />
              </DialogHeader>

              <DialogFooter>
                <Button type="button" className="w-full" onClick={handleConfirmOpenOrder}>
                  Abrir comanda
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </form>
      </div>

      <Separator className="h-px bg-border" />

      <div className="flex gap-3 p-4 rounded-xl">
        {categories?.map((category: TCategory) => (
          <Button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            variant={selectedCategory?.id === category.id ? "default" : "outline"}
          >
            {category.name}
          </Button>
        ))}
      </div>

      <div className="rounded-xl flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <div className="p-4 grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts?.map((product: TProduct) => {
            const orderItem = order?.orderItems?.find((item) => item.product.id === product.id);
            const quantity = orderItem?.quantity ?? 0;

            return (
              <Card key={product.id} className="p-4 relative overflow-visible justify-between">
                {quantity > 0 && (
                  <span
                    className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center
                    rounded-full bg-primary text-xs font-bold text-primary-foreground shadow"
                  >
                    {quantity}
                  </span>
                )}
                <div>
                  <CardTitle className="text-sm font-bold">{product.name}</CardTitle>
                  <CardContent className="text-xs font-medium p-0">{formatCurrency(product.price)}</CardContent>
                </div>
                <Button size="lg" onClick={() => onAddProduct(product)} disabled={!hasActiveOrder}>
                  Adicionar
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
