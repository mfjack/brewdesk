// import { ShoppingBag } from "lucide-react";
import { Send } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Card } from "@/_components/ui/card";

export function MenuList() {
   return (
      <div className="h-screen w-1/2">
         {/* <div className="flex flex-col items-center justify-center gap-2 px-5 text-center">
            <ShoppingBag className="size-6" />
            <p className="text-sm font-medium">Nenhuma comanda aberta</p>
            <p className="text-xs text-muted-foreground text-pretty">
               Digite o nome do cliente e abra a comanda para começar a adicionar itens.
            </p>
         </div> */}

         <div className="flex flex-col h-full">
            <p className="p-4 text-sm text-muted-foreground">
               Comanda de <span className="font-bold">Jack</span>
            </p>

            <Separator className="h-px bg-border" />

            <div className="flex-1 flex-col gap-4 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden">
               {/* <p className="flex h-full justify-center items-center">Adicione itens do cardápio à comanda.</p> */}

               <Card className="flex flex-row items-center justify-between p-4">
                  <div className="flex items-center gap-6">
                     <span className="text-sm font-bold">4</span>

                     <div className="flex flex-col items-start">
                        <p className="text-sm font-bold">Cappuccino</p>
                        <p className="text-xs text-muted-foreground">R$ 16,00</p>
                     </div>
                  </div>

                  <Button size="sm">Remover</Button>
               </Card>
            </div>

            <div className="flex flex-row items-center justify-between p-4 w-full">
               <p className="px-4 py-2 text-lg font-bold">Total: </p>
               <span className="px-4 py-2 text-lg font-bold">R$ 64,00</span>
            </div>

            <Button className="mx-4 mb-4" size="lg">
               <Send />
               Enviar pedido
            </Button>
         </div>
      </div>
   );
}
