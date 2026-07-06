"use client";

import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { Trash2 } from "lucide-react";
import { useGetCategories } from "../query/useGetCategories";
import { useDeleteCategory } from "../mutation/useDeleteCategory";

export default function CategoryPage() {
   const { data: categories = [] } = useGetCategories();
   const deleteCategory = useDeleteCategory();

   function handleAddCategory() {
      // Implement the logic to add a new category
   }

   function handleDeleteCategory(categoryId: number) {
      deleteCategory.mutate(categoryId);
   }

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
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                     <Trash2 />
                  </Button>
               </Card>
            ))}
         </div>
      </section>
   );
}
