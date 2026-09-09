"use client";

import { useEffect, useRef, useState } from "react";

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

import { useSearchParams } from "next/navigation";
import { useGetOrderById } from "../query/useGetOrderById";
import { OrderReceipt } from "@/app/order/_components/order-receipt";

export default function OrderPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [selectedCategory, setSelectedCategory] = useState<TCategory | null>(null);

  const [currentOrder, setCurrentOrder] = useState<TOrderResponse | null>(null);

  const [printOrder, setPrintOrder] = useState<TOrderResponse | null>(null);

  const [observation, setObservation] = useState("");

  const [printedItemQuantities, setPrintedItemQuantities] = useState<Record<number, number>>({});

  const [printMode, setPrintMode] = useState<"full" | "additional" | null>(null);

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

  const [customerNameDraft, setCustomerNameDraft] = useState("");

  const [isSendingOrder, setIsSendingOrder] = useState(false);

  /**
   * Evita criar duas comandas simultaneamente
   * em caso de duplo clique/duplo Enter no envio.
   */
  const sendingOrderRef = useRef(false);

  const { data: categories } = useGetCategories();
  const { data: products } = useGetProducts();

  const createOrder = useCreateOrder();
  const addOrderItem = useAddOrderItem();
  const removeOrderItem = useRemoveOrderItem();
  const updateOrderStatus = useUpdateOrderStatus();
  const markOrderItemsPrinted = useMarkOrderItemsPrinted();

  const { data: existingOrder } = useGetOrderById(orderId ? Number(orderId) : null);

  /**
   * Se abrimos uma comanda existente,
   * recuperamos os dados dela.
   */
  useEffect(() => {
    if (!existingOrder) {
      return;
    }

    setCurrentOrder(existingOrder);
    setObservation(existingOrder.observation ?? "");
    setPrintedItemQuantities(existingOrder.printedItemQuantities ?? {});
  }, [existingOrder]);

  /**
   * Categorias
   */
  const filteredProducts = selectedCategory
    ? products?.filter((product: TProduct) => product.category.id === selectedCategory.id)
    : products;

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

  /**
   * Adiciona produto.
   *
   * Enquanto a comanda ainda não tiver nome (id === 0,
   * rascunho local que nunca foi criado no store), o item
   * fica só em memória — nada é persistido ainda.
   */
  async function handleAddProduct(product: TProduct) {
    if (!currentOrder || currentOrder.id === 0) {
      setCurrentOrder((prev) => {
        const base: TOrderResponse =
          prev ?? {
            id: 0,
            customerName: "",
            status: "OPEN",
            createdAt: new Date().toISOString(),
            total: 0,
            orderItems: [],
            observation: null,
          };

        const existingItem = base.orderItems.find((item) => item.product.id === product.id);

        const orderItems = existingItem
          ? base.orderItems.map((item) =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
                : item,
            )
          : [
              ...base.orderItems,
              {
                id: product.id,
                product,
                quantity: 1,
                unitPrice: product.price,
                subtotal: product.price,
                observation: null,
              },
            ];

        return {
          ...base,
          orderItems,
          total: orderItems.reduce((sum, item) => sum + item.subtotal, 0),
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

    if (currentOrder.id === 0) {
      const item = currentOrder.orderItems.find((item) => item.id === itemId);

      if (!item) {
        return;
      }

      const orderItems =
        item.quantity > 1
          ? currentOrder.orderItems.map((i) =>
              i.id === itemId ? { ...i, quantity: i.quantity - 1, subtotal: (i.quantity - 1) * i.unitPrice } : i,
            )
          : currentOrder.orderItems.filter((i) => i.id !== itemId);

      if (orderItems.length === 0) {
        setCurrentOrder(null);
      } else {
        setCurrentOrder({
          ...currentOrder,
          orderItems,
          total: orderItems.reduce((sum, i) => sum + i.subtotal, 0),
        });
      }

      return;
    }

    const updatedOrder = await removeOrderItem.mutateAsync({
      orderId: currentOrder.id,
      itemId,
    });

    setCurrentOrder(updatedOrder);

    const updatedPrintedQty = {
      ...printedItemQuantities,
    };

    const itemStillExists = updatedOrder.orderItems.some((item: TOrderItem) => item.id === itemId);

    if (itemStillExists) {
      const item = updatedOrder.orderItems.find((item: TOrderItem) => item.id === itemId);

      if (item) {
        updatedPrintedQty[itemId] = Math.min(updatedPrintedQty[itemId] ?? 0, item.quantity);
      }
    } else {
      delete updatedPrintedQty[itemId];
    }

    setPrintedItemQuantities(updatedPrintedQty);
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
   * Se a comanda ainda é um rascunho local (id === 0,
   * nunca criada no store), ela é criada agora — só neste
   * momento, com o nome informado — junto com os itens que
   * já tinham sido adicionados em memória.
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

      if (order.id === 0) {
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

      setPrintOrder(orderWithPrintedItems);

      setPrintedItemQuantities(printedQty);

      setPrintMode("full");

      setTimeout(async () => {
        window.print();

        await markOrderItemsPrinted.mutateAsync({
          orderId: updatedOrder.id,
          printedItemQuantities: printedQty,
        });

        setPrintMode(null);
        setPrintOrder(null);
      }, 100);
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

    const orderToPrint: TOrderResponse = {
      ...currentOrder,
      printedItemQuantities: printedItemQuantities,
    };

    setPrintOrder(orderToPrint);
    setPrintMode("additional");

    setTimeout(async () => {
      window.print();

      await markOrderItemsPrinted.mutateAsync({
        orderId: currentOrder.id,
        printedItemQuantities: printedQty,
      });

      setPrintedItemQuantities(printedQty);

      setPrintMode(null);
      setPrintOrder(null);
    }, 100);
  }

  return (
    <>
      {printOrder && (
        <OrderReceipt
          order={printOrder}
          observation={printOrder.observation ?? observation}
          printMode={printMode}
          printedItemQuantities={printedItemQuantities}
        />
      )}

      <section className="flex flex-row h-full print:hidden">
        <OrderPanel
          categories={categories || []}
          selectedCategory={selectedCategory}
          handleCategoryClick={handleCategoryClick}
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
            onSendOrder={handleRequestSendOrder}
            isSending={isSendingOrder || updateOrderStatus.isPending}
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
