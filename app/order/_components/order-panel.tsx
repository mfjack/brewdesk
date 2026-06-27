import { Button } from "@/_components/ui/button";
import { Card, CardContent, CardTitle } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";

export interface TOrderPanel {
   categories: TCategory[];
   products: TProduct[];
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

export function OrderPanel({ categories, products, selectedCategory, handleCategoryClick, filteredProducts }: TOrderPanel) {
   return (
      <div>
         <div className="p-6 flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Abra uma comanda e monte o pedido do cliente.</p>

            <div className="flex gap-2 max-w-105">
               <Input type="text" placeholder="Nome do cliente" />
               <Button>Abrir Comanda</Button>
            </div>
         </div>
         <Separator />
         <div className="flex gap-2 px-6 mt-2">
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
         <div className="flex flex-wrap gap-6 px-6 mt-2">
            {filteredProducts?.map((product: TProduct) => (
               <Card key={product.id} className="w-96 p-4">
                  <CardTitle className="text-lg font-bold">{product.name}</CardTitle>
                  <CardContent className="text-sm font-bold p-0">R${product.price.toFixed(2)}</CardContent>
                  <Button className="w-full">Adicionar</Button>
               </Card>
            ))}
         </div>
      </div>
   );
}
