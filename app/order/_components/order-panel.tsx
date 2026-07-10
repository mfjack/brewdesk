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
}: TOrderPanel) {
   const [isOpenOrderDialogOpen, setIsOpenOrderDialogOpen] = useState(false);

   async function handleConfirmOpenOrder() {
      await onOpenOrder();
      setIsOpenOrderDialogOpen(false);
   }

   return (
      <section className="flex flex-col h-screen w-full">
         <div className="flex flex-col p-4">
            <div className="flex items-center justify-between w-full">
               <div>
                  <h1 className="text-2xl font-bold">PDV</h1>
                  <p className="text-sm text-muted-foreground">Registre produtos, monte pedidos e finalize vendas.</p>
               </div>
               <Button size="lg" onClick={() => setIsOpenOrderDialogOpen(true)}>
                  <Plus />
                  Novo pedido
               </Button>

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
                        <DialogClose asChild>
                           <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleConfirmOpenOrder}>
                           Abrir comanda
                        </Button>
                     </DialogFooter>
                  </DialogContent>
               </Dialog>
            </div>
         </div>

         <Separator className="h-px bg-border" />

         <div className="p-4">
            <div className="flex gap-2 p-4 rounded-xl">
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
         </div>

         <div className="px-4 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <div className="p-4 rounded-xl ">
               <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredProducts?.map((product: TProduct) => (
                     <Card key={product.id} className="p-4">
                        <CardTitle className="text-lg font-bold">{product.name}</CardTitle>
                        <CardContent className="text-sm font-bold p-0">{formatCurrency(product.price)}</CardContent>
                        <Button size="lg" onClick={() => onAddProduct(product)} disabled={!hasActiveOrder}>
                           Adicionar
                        </Button>
                     </Card>
                  ))}
               </div>
            </div>
         </div>
      </section>
   );
}
