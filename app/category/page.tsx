"use client";

import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { Trash2 } from "lucide-react";
import { getCategories } from "../query/product";

export default function CategoryPage() {
   const { data: categories = [] } = getCategories();

   return (
      <section className="flex flex-col h-screen">
         <div className="flex flex-col p-4">
            <h1 className="text-xl font-bold">Categorias</h1>
            <p className="text-sm text-muted-foreground">Organize o cardápio em categorias.</p>
         </div>

         <Separator className="h-px w-full" />

         <div className="flex items-center flex-row gap-2 w-1/3 p-4">
            <Input type="text" placeholder="Nome da categoria" />
            <Button size="lg">Adicionar categoria</Button>
         </div>

         <div className="flex gap-3 w-full p-4">
            {categories?.map((category: { id: number; name: string }) => (
               <Card key={category.id} className="flex flex-row justify-between items-center w-full p-4">
                  <span>{category.name}</span>
                  <Button variant="destructive" size="sm">
                     <Trash2 />
                  </Button>
               </Card>
            ))}
         </div>
      </section>
   );
}
