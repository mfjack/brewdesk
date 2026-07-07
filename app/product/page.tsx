"use client";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { TCreateProduct, useCreateProduct } from "./mutation/useCreateProduct";
import { Controller, useForm } from "react-hook-form";
import { useGetProducts } from "./query/useGetProducts";
import { Card } from "@/_components/ui/card";
import { Trash2 } from "lucide-react";
import { useGetCategories } from "../category/query/useGetCategories";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import { useDeleteProduct } from "./mutation/useDeleteProduct";

export default function ProductPage() {
   const createProduct = useCreateProduct();
   const { data: products } = useGetProducts();
   const { data: categories } = useGetCategories();
   const deleteProduct = useDeleteProduct();

   const { register, handleSubmit, control, reset } = useForm<TCreateProduct>();

   function handleCreateProduct(data: TCreateProduct) {
      createProduct.mutate({
         ...data,
      });
      reset();
   }

   function handleDeleteProduct(productId: number) {
      deleteProduct.mutate(productId);
   }

   return (
      <section className="flex flex-col h-screen">
         <div className="flex flex-col p-4">
            <h1 className="text-xl font-bold">Produtos</h1>
            <p className="text-sm text-muted-foreground">Gerencie os itens do cardápio.</p>
         </div>

         <Separator className="h-px w-full" />

         <form className="flex items-center flex-row gap-2 lg:w-1/3 w-full p-4" onSubmit={handleSubmit(handleCreateProduct)}>
            <Input type="text" placeholder="Nome do produto" {...register("name")} />
            <Input type="number" placeholder="Preço do produto" {...register("price")} />

            <Controller
               control={control}
               name="categoryId"
               render={({ field }) => (
                  <Select value={String(field.value ?? "")} onValueChange={(value) => field.onChange(Number(value))}>
                     <SelectTrigger>
                        <SelectValue placeholder="Categoria" />
                     </SelectTrigger>
                     <SelectContent>
                        {categories?.map((category: any) => (
                           <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               )}
            />

            <Button size="lg" type="submit">
               {createProduct.isPending ? "Adicionando..." : "Adicionar produto"}
            </Button>
         </form>

         <div className="p-4 flex gap-2 flex-col">
            {products?.map((product: any) => (
               <Card key={product.id} className="flex flex-row justify-between items-center w-full p-4">
                  <div className="flex flex-col">
                     <span>{product.name}</span>
                     <span>R$ {product.price.toFixed(2)}</span>
                     <span className="text-sm text-muted-foreground">{product.category.name}</span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                     <Trash2 />
                  </Button>
               </Card>
            ))}
         </div>
      </section>
   );
}
