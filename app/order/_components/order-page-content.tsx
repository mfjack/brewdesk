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
import { OrderReceipt } from "@/app/order/_components/order-receipt";
import { useDeleteOrder } from "../../order-detail/mutation/useDeleteOrder";

export default function OrderPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [selectedCategory, setSelectedCategory] = useState<TCategory | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [currentOrder, setCurrentOrder] = useState<TOrderResponse | null>(null);
  const [observation, setObservation] = useState("");
  const [printedItemQuantities, setPrintedItemQuantities] = useState<Record<number, number>>({});
  const [printMode, setPrintMode] = useState<"full" | "additional" | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { data: categories } = useGetCategories();
  const { data: products } = useGetProducts();
  const createOrder = useCreateOrder();
  const addOrderItem = useAddOrderItem();
  const removeOrderItem = useRemoveOrderItem();
  const updateOrderStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const { data: existingOrder } = useGetOrderById(orderId ? Number(orderId) : null);

  useEffect(() => {
    if (existingOrder) {
      setCurrentOrder(existingOrder);
      setObservation("");
      // Recupera printedItemQuantities do localStorage para essa comanda
      const storedPrintedQty = localStorage.getItem(`printed_items_${existingOrder.id}`);
      if (storedPrintedQty) {
        setPrintedItemQuantities(JSON.parse(storedPrintedQty));
      } else {
        setPrintedItemQuantities({});
      }
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
    setObservation("");
    setPrintedItemQuantities({});
    // Limpa o localStorage para a nova comanda
    localStorage.removeItem(`printed_items_${order.id}`);
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
    // Remove o item do printedItemQuantities se estava lá
    const updatedQty = { ...printedItemQuantities };
    delete updatedQty[itemId];
    setPrintedItemQuantities(updatedQty);
    localStorage.setItem(`printed_items_${order.id}`, JSON.stringify(updatedQty));
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
    // Cria um objeto com id -> quantidade de cada item
    const printedQty: Record<number, number> = {};
    updatedOrder.orderItems.forEach((item) => {
      printedQty[item.id] = item.quantity;
    });
    setPrintedItemQuantities(printedQty);
    // Persiste no localStorage
    localStorage.setItem(`printed_items_${updatedOrder.id}`, JSON.stringify(printedQty));
    setPrintMode("full");
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 100);
  }

  function handlePrintAdditional() {
    if (!currentOrder) {
      return;
    }

    setPrintMode("additional");
    setTimeout(() => {
      window.print();
      // Depois de imprimir, marca todos os itens como impressos
      const printedQty: Record<number, number> = {};
      currentOrder.orderItems.forEach((item) => {
        printedQty[item.id] = item.quantity;
      });
      setPrintedItemQuantities(printedQty);
      // Persiste no localStorage
      localStorage.setItem(`printed_items_${currentOrder.id}`, JSON.stringify(printedQty));
      setPrintMode(null);
    }, 100);
  }

  function handleOpenPaymentDialog() {
    setIsPaymentDialogOpen(true);
  }

  async function handleConfirmPayment() {
    if (!currentOrder) {
      return;
    }

    await deleteOrder.mutateAsync({ orderId: currentOrder.id });
    // Limpa do localStorage
    localStorage.removeItem(`printed_items_${currentOrder.id}`);
    setCurrentOrder(null);
    setIsPaymentDialogOpen(false);
  }

  return (
    <>
      {currentOrder && (
        <OrderReceipt
          order={currentOrder}
          observation={observation}
          printMode={printMode}
          printedItemQuantities={printedItemQuantities}
        />
      )}

      <section className="flex flex-row h-full print:hidden">
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
            printedItemQuantities={printedItemQuantities}
            onPrintAdditional={handlePrintAdditional}
            onOpenPaymentDialog={handleOpenPaymentDialog}
            onConfirmPayment={handleConfirmPayment}
            isProcessing={deleteOrder.isPending}
            isPaymentDialogOpen={isPaymentDialogOpen}
            onPaymentDialogOpenChange={setIsPaymentDialogOpen}
          />
        )}
      </section>
    </>
  );
}
