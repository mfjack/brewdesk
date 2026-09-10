"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MenuList } from "./menu-list";
import { OrderPanel } from "./order-panel";
import { Separator } from "@/_components/ui/separator";

import { useGetCategories } from "../../category/query/useGetCategories";
import { useGetProducts } from "../../product/query/useGetProducts";

import { useCreateOrder } from "../mutation/useCreateOrder";
import { useAddOrderItem } from "../mutation/useAddOrderItem";
import { useRemoveOrderItem } from "../mutation/useRemoveOrderItem";
import { useUpdateOrderStatus } from "../mutation/useUpdateOrderStatus";
import { useMarkOrderItemsPrinted } from "../mutation/useMarkOrderItemsPrinted";

import { TCategory, TOrderItem, TOrderResponse, TProduct } from "../interface";
import { computeOrderTotal, decrementOrRemoveItem, DRAFT_ORDER_ID, isDraftOrder, mergeOrderItem } from "../order-math";

import { useSearchParams } from "next/navigation";
import { useGetOrderById } from "../query/useGetOrderById";
import { OrderReceipt } from "@/app/order/_components/order-receipt";

type PrintJob = {
  order: TOrderResponse;
  mode: "full" | "additional";
};

export default function OrderPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [selectedCategory, setSelectedCategory] = useState<TCategory | null>(null);

  const [currentOrder, setCurrentOrder] = useState<TOrderResponse | null>(null);

  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  const [observation, setObservation] = useState("");

  const [printedItemQuantities, setPrintedItemQuantities] = useState<Record<number, number>>({});

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

  const [customerNameDraft, setCustomerNameDraft] = useState("");

  const [isSendingOrder, setIsSendingOrder] = useState(false);

  const sendingOrderRef = useRef(false);

  const { data: categories } = useGetCategories();
  const { data: products } = useGetProducts();

  const createOrder = useCreateOrder();
  const addOrderItem = useAddOrderItem();
  const removeOrderItem = useRemoveOrderItem();
  const updateOrderStatus = useUpdateOrderStatus();
  const markOrderItemsPrinted = useMarkOrderItemsPrinted();

  const { data: existingOrder } = useGetOrderById(orderId ? Number(orderId) : null);

  useEffect(() => {
    if (!existingOrder) {
      return;
    }

    setCurrentOrder(existingOrder);
    setObservation(existingOrder.observation ?? "");
    setPrintedItemQuantities(existingOrder.printedItemQuantities ?? {});
  }, [existingOrder]);

  const filteredProducts = useMemo(
    () => (selectedCategory ? products?.filter((product: TProduct) => product.category.id === selectedCategory.id) : products),
    [products, selectedCategory],
  );

  function handleCategoryClick(categoryId: number) {
    const category = categories?.find((cat: TCategory) => cat.id === categoryId);

    setSelectedCategory(category || null);
  }

  useEffect(() => {
    if (!categories?.length || selectedCategory) {
      return;
    }

    const defaultCategory = categories.find((category: TCategory) => category.id === 1) ?? categories[0];

    setSelectedCategory(defaultCategory);
  }, [categories, selectedCategory]);

  function schedulePrint(orderIdToMark: number, printedQty: Record<number, number>, onAfterPrint?: () => void) {
    setTimeout(async () => {
      window.print();

      await markOrderItemsPrinted.mutateAsync({
        orderId: orderIdToMark,
        printedItemQuantities: printedQty,
      });

      onAfterPrint?.();
      setPrintJob(null);
    }, 100);
  }

  async function handleAddProduct(product: TProduct) {
    if (!currentOrder || isDraftOrder(currentOrder)) {
      setCurrentOrder((prev) => {
        const base: TOrderResponse = prev ?? {
          id: DRAFT_ORDER_ID,
          customerName: "",
          status: "OPEN",
          createdAt: new Date().toISOString(),
          total: 0,
          orderItems: [],
          observation: null,
        };

        const orderItems = mergeOrderItem(base.orderItems, product, 1, () => product.id);

        return {
          ...base,
          orderItems,
          total: computeOrderTotal(orderItems),
        };
      });

      return;
    }

    const updatedOrder = await addOrderItem.mutateAsync({
      orderId: currentOrder.id,
      productId: product.id,
      quantity: 1,
    });

    setCurrentOrder(updatedOrder);
  }

  /**
   * Remove item.
   *
   * Mesma lógica: se a comanda ainda é um rascunho local,
   * a remoção só acontece em memória.
   */
  async function handleRemoveItem(itemId: number) {
    if (!currentOrder) {
      return;
    }

    if (isDraftOrder(currentOrder)) {
      const orderItems = decrementOrRemoveItem(currentOrder.orderItems, itemId);

      if (orderItems.length === 0) {
        setCurrentOrder(null);
      } else {
        setCurrentOrder({
          ...currentOrder,
          orderItems,
          total: computeOrderTotal(orderItems),
        });
      }

      return;
    }

    const updatedOrder = await removeOrderItem.mutateAsync({
      orderId: currentOrder.id,
      itemId,
    });

    setCurrentOrder(updatedOrder);
    setPrintedItemQuantities(updatedOrder.printedItemQuantities ?? {});
  }

  /**
   * Usuário clicou em "Enviar pedido".
   */
  function handleRequestSendOrder() {
    if (!currentOrder || currentOrder.orderItems.length === 0 || isSendingOrder) {
      return;
    }

    if (currentOrder.customerName.trim()) {
      void sendOrder(currentOrder.customerName);

      return;
    }

    setCustomerNameDraft("");
    setIsNameDialogOpen(true);
  }

  /**
   * Confirma nome do cliente.
   */
  async function handleConfirmCustomerName() {
    const trimmedName = customerNameDraft.trim();

    if (!trimmedName) {
      return;
    }

    setIsNameDialogOpen(false);

    await sendOrder(trimmedName);
  }

  /**
   * Envia pedido.
   *
   * Se a comanda ainda é um rascunho local (nunca criada no
   * store), ela é criada agora — só neste momento, com o
   * nome informado — junto com os itens que já tinham sido
   * adicionados em memória.
   *
   * Se a comanda já existe, ela continua sendo a comanda
   * atual para permitir adicionais (não cria outra).
   */
  async function sendOrder(customerName: string) {
    if (!currentOrder || currentOrder.orderItems.length === 0 || sendingOrderRef.current) {
      return;
    }

    sendingOrderRef.current = true;
    setIsSendingOrder(true);

    try {
      let order = currentOrder;

      if (isDraftOrder(order)) {
        const created = await createOrder.mutateAsync({ customerName });

        order = created;

        for (const item of currentOrder.orderItems) {
          order = await addOrderItem.mutateAsync({
            orderId: created.id,
            productId: item.product.id,
            quantity: item.quantity,
          });
        }
      }

      const updatedOrder = await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: "PENDING",
        observation,
        customerName,
      });

      const printedQty: Record<number, number> = {};

      updatedOrder.orderItems.forEach((item: TOrderItem) => {
        printedQty[item.id] = item.quantity;
      });

      const orderWithPrintedItems: TOrderResponse = {
        ...updatedOrder,
        printedItemQuantities: printedQty,
      };

      setCurrentOrder(orderWithPrintedItems);

      setPrintJob({ order: orderWithPrintedItems, mode: "full" });

      setPrintedItemQuantities(printedQty);

      schedulePrint(updatedOrder.id, printedQty);
    } finally {
      sendingOrderRef.current = false;
      setIsSendingOrder(false);
    }
  }

  /**
   * Imprime somente os adicionais.
   */
  function handlePrintAdditional() {
    if (!currentOrder) {
      return;
    }

    const printedQty: Record<number, number> = {
      ...printedItemQuantities,
    };

    currentOrder.orderItems.forEach((item: TOrderItem) => {
      printedQty[item.id] = item.quantity;
    });

    setPrintJob({
      order: { ...currentOrder, printedItemQuantities: printedItemQuantities },
      mode: "additional",
    });

    schedulePrint(currentOrder.id, printedQty, () => setPrintedItemQuantities(printedQty));
  }

  return (
    <>
      {printJob && (
        <OrderReceipt
          order={printJob.order}
          observation={observation}
          printMode={printJob.mode}
          printedItemQuantities={printedItemQuantities}
        />
      )}

      <section className="flex flex-row h-full print:hidden">
        <OrderPanel
          categories={categories || []}
          selectedCategory={selectedCategory}
          handleCategoryClick={handleCategoryClick}
          filteredProducts={filteredProducts}
          onAddProduct={handleAddProduct}
          order={currentOrder}
        />

        <Separator orientation="vertical" className="w-px bg-border" />

        {currentOrder && (
          <MenuList
            order={currentOrder}
            onRemoveItem={handleRemoveItem}
            onSendOrder={handleRequestSendOrder}
            isSending={isSendingOrder}
            isRemovingItem={removeOrderItem.isPending}
            observation={observation}
            onObservationChange={setObservation}
            printedItemQuantities={printedItemQuantities}
            onPrintAdditional={handlePrintAdditional}
            isNameDialogOpen={isNameDialogOpen}
            onNameDialogOpenChange={setIsNameDialogOpen}
            customerNameDraft={customerNameDraft}
            onCustomerNameDraftChange={setCustomerNameDraft}
            onConfirmCustomerName={handleConfirmCustomerName}
          />
        )}
      </section>
    </>
  );
}
