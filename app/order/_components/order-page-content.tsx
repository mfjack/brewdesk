"use client";

import { useEffect, useState } from "react";
import { MenuList } from "./menu-list";
import { OrderPanel } from "./order-panel";
import { Separator } from "@/_components/ui/separator";
import { useGetCategories } from "../../category/query/useGetCategories";
import { useGetProducts } from "../../product/query/useGetProducts";
import { useCreateOrder } from "../mutation/useCreateOrder";
import { useAddOrderItem } from "../mutation/useAddOrderItem";
import { useRemoveOrderItem } from "../mutation/useRemoveOrderItem";
import { useUpdateOrderStatus } from "../mutation/useUpdateOrderStatus";
import { TCategory, TOrderResponse, TProduct } from "../interface";
import { useSearchParams } from "next/navigation";
import { useGetOrderById } from "../query/useGetOrderById";

export default function OrderPageContent() {
   const searchParams = useSearchParams();
   const orderId = searchParams.get("orderId");

   const [selectedCategory, setSelectedCategory] = useState<TCategory | null>(null);
   const [customerName, setCustomerName] = useState("");
   const [currentOrder, setCurrentOrder] = useState<TOrderResponse | null>(null);
   const [observation, setObservation] = useState("");
   const { data: categories } = useGetCategories();
   const { data: products } = useGetProducts();
   const createOrder = useCreateOrder();
   const addOrderItem = useAddOrderItem();
   const removeOrderItem = useRemoveOrderItem();
   const updateOrderStatus = useUpdateOrderStatus();
   const { data: existingOrder } = useGetOrderById(orderId ? Number(orderId) : null);

   useEffect(() => {
      if (existingOrder) {
         setCurrentOrder(existingOrder);
      }
   }, [existingOrder]);

   const filteredProducts = selectedCategory
      ? products?.filter((product: TProduct) => product.category.id === selectedCategory.id)
      : products;

   function handleCategoryClick(categoryId: number) {
      const category = categories?.find((cat: TCategory) => cat.id === categoryId);
      setSelectedCategory(category || null);
   }

   useEffect(() => {
      if (!categories?.length || selectedCategory) return;

      const defaultCategory = categories.find((category: TCategory) => category.id === 1) ?? categories[0];

      setSelectedCategory(defaultCategory);
   }, [categories, selectedCategory]);

   async function handleOpenOrder() {
      const trimmedName = customerName.trim();

      if (!trimmedName) {
         return;
      }

      const order = await createOrder.mutateAsync({ customerName: trimmedName });
      setCurrentOrder(order);
      setCustomerName("");
   }

   async function handleAddProduct(product: TProduct) {
      if (!currentOrder) {
         return;
      }

      const order = await addOrderItem.mutateAsync({
         orderId: currentOrder.id,
         productId: product.id,
         quantity: 1,
      });

      setCurrentOrder(order);
   }

   async function handleRemoveItem(itemId: number) {
      if (!currentOrder) {
         return;
      }

      const order = await removeOrderItem.mutateAsync({
         orderId: currentOrder.id,
         itemId,
      });

      setCurrentOrder(order);
   }

   async function handleSendOrder() {
      if (!currentOrder) {
         return;
      }

      const updatedOrder = await updateOrderStatus.mutateAsync({
         orderId: currentOrder.id,
         status: "PENDING",
         observation,
      });

      setCurrentOrder(updatedOrder);
      window.print();
   }

   return (
      <section className="flex flex-row h-full">
         <OrderPanel
            categories={categories || []}
            selectedCategory={selectedCategory}
            handleCategoryClick={handleCategoryClick}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            onOpenOrder={handleOpenOrder}
            hasActiveOrder={Boolean(currentOrder)}
            filteredProducts={filteredProducts}
            onAddProduct={handleAddProduct}
            order={currentOrder}
         />
         <Separator orientation="vertical" className="w-px bg-border" />
         {currentOrder && (
            <MenuList
               order={currentOrder}
               onRemoveItem={handleRemoveItem}
               onSendOrder={handleSendOrder}
               isSending={updateOrderStatus.isPending}
               isRemovingItem={removeOrderItem.isPending}
               observation={observation}
               onObservationChange={setObservation}
            />
         )}
      </section>
   );
}
