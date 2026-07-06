"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MenuList } from "./_components/menu-list";
import { OrderPanel, TCategory, TProduct } from "./_components/order-panel";
import { Separator } from "@/_components/ui/separator";

export default function OrderPage() {
   const [selectedCategory, setSelectedCategory] = useState<TCategory | null>(null);

   const { data: categories } = useQuery({
      queryKey: ["categories"],
      queryFn: async () => {
         const response = await fetch("http://localhost:8080/categories");
         return response.json();
      },
   });

   const { data: products } = useQuery({
      queryKey: ["products"],
      queryFn: async () => {
         const response = await fetch("http://localhost:8080/products");
         return response.json();
      },
   });

   const filteredProducts = selectedCategory
      ? products?.filter((product: TProduct) => product.category.id === selectedCategory.id)
      : products;

   function handleCategoryClick(categoryId: number) {
      const category = categories?.find((cat: TCategory) => cat.id === categoryId);
      setSelectedCategory(category || null);
   }

   return (
      <section className="flex flex-row h-full">
         <OrderPanel
            categories={categories || []}
            selectedCategory={selectedCategory}
            handleCategoryClick={handleCategoryClick}
            filteredProducts={filteredProducts}
         />
         <Separator orientation="vertical" className="w-px bg-border" />
         <MenuList />
      </section>
   );
}
