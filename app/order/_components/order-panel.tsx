import { useState } from "react";

import { Button } from "@/_components/ui/button";
import { Card, CardContent, CardTitle } from "@/_components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { formatCurrency } from "@/_lib/format-currency";
import { TCategory, TOrderPanel, TProduct } from "../interface";
import { Plus } from "lucide-react";

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

   async function handleConfirmOpenOrder() {
      await onOpenOrder();
      setIsOpenOrderDialogOpen(false);
   }

   return (
      <section className="flex flex-col h-screen w-full">
         <div className="flex flex-col p-4 w-full">
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="text-2xl font-bold">PDV</h1>
                  <p className="text-sm text-muted-foreground">Registre produtos, monte pedidos e finalize vendas.</p>
               </div>
               <Button size="lg" onClick={() => setIsOpenOrderDialogOpen(true)}>
                  <Plus />
                  Novo pedido
               </Button>
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
                  const orderItem = order?.orderItems.find((item) => item.product.id === product.id);
                  const quantity = orderItem?.quantity ?? 0;

                  return (
                     <Card key={product.id} className="p-4 relative overflow-visible">
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
