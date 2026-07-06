import { Button } from "@/_components/ui/button";
import { Card, CardContent, CardTitle } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";

export interface TOrderPanel {
   categories: TCategory[];
   selectedCategory: TCategory | null;
   handleCategoryClick: (categoryId: number) => void;
   filteredProducts: TProduct[] | undefined;
}

export interface TCategory {
   id: number;
   name: string;
}

export interface TProduct {
   id: number;
   name: string;
   price: number;
   category: {
      id: number;
      name: string;
   };
}

export function OrderPanel({ categories, selectedCategory, handleCategoryClick, filteredProducts }: TOrderPanel) {
   return (
      <section className="flex flex-col h-screen w-full">
         <div className="flex flex-col gap-2 p-4 bg-muted/50">
            <p>Abra uma comanda e monte o pedido do cliente.</p>
            <div className="flex items-center flex-row gap-2 w-1/2">
               <Input type="text" placeholder="Nome do cliente" />
               <Button size="lg">Abrir Comanda</Button>
            </div>
         </div>

         <Separator className="h-px bg-border" />

         <div className="flex gap-2 p-4">
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

         <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-wrap gap-4 p-4">
               {filteredProducts?.map((product: TProduct) => (
                  <Card key={product.id} className="w-75 p-4">
                     <CardTitle className="text-lg font-bold">{product.name}</CardTitle>
                     <CardContent className="text-sm font-bold p-0">R${product.price.toFixed(2)}</CardContent>
                     <Button size="lg">Adicionar</Button>
                  </Card>
               ))}
            </div>
         </div>
      </section>
   );
}
