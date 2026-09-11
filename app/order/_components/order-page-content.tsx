"use client";

import { useMemo, useRef, useState } from "react";

import { MenuList } from "./menu-list";
import { OrderPanel } from "./order-panel";
import { Separator } from "@/_components/ui/separator";

import { useGetCategories } from "../../category/query/useGetCategories";
import { useGetProducts } from "../../product/query/useGetProducts";
import { useGetOrder } from "../../kitchen/query/useGetOrder";

import { useCreateOrder } from "../mutation/useCreateOrder";
import { useAddOrderItem } from "../mutation/useAddOrderItem";
import { useRemoveOrderItem } from "../mutation/useRemoveOrderItem";
import { useUpdateOrderStatus } from "../mutation/useUpdateOrderStatus";
import { useMarkOrderItemsPrinted } from "../mutation/useMarkOrderItemsPrinted";

import { TCategory, TOrderItem, TOrderResponse, TProduct } from "../interface";
import { computeOrderTotal, decrementOrRemoveItem, DRAFT_ORDER_ID, isDraftOrder, mergeOrderItem } from "../order-math";
import { getActiveOperator } from "@/_lib/operator-session";

import { useRouter, useSearchParams } from "next/navigation";
import { useGetOrderById } from "../query/useGetOrderById";
import { OrderReceipt } from "@/app/order/_components/order-receipt";

type PrintJob = {
  order: TOrderResponse;
  mode: "full" | "additional";
};

export default function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [selectedCategory, setSelectedCategory] = useState<TCategory | null>(null);

  const [currentOrder, setCurrentOrder] = useState<TOrderResponse | null>(null);
  const [syncedOrderId, setSyncedOrderId] = useState<number | null>(null);

  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  const [observation, setObservation] = useState("");

  const [printedItemQuantities, setPrintedItemQuantities] = useState<Record<number, number>>({});

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

  const [customerNameDraft, setCustomerNameDraft] = useState("");

  const [isTakeoutDraft, setIsTakeoutDraft] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);

  const [stockError, setStockError] = useState<string | null>(null);

  const [isSendingOrder, setIsSendingOrder] = useState(false);

  const sendingOrderRef = useRef(false);

  const { data: categories } = useGetCategories();
  const { data: products } = useGetProducts();
  const { data: orders = [] } = useGetOrder();

  const createOrder = useCreateOrder();
  const addOrderItem = useAddOrderItem();
  const removeOrderItem = useRemoveOrderItem();
  const updateOrderStatus = useUpdateOrderStatus();
  const markOrderItemsPrinted = useMarkOrderItemsPrinted();

  const { data: existingOrder } = useGetOrderById(orderId ? Number(orderId) : null);

  if (existingOrder && existingOrder.id !== syncedOrderId) {
    setSyncedOrderId(existingOrder.id);
    setCurrentOrder(existingOrder);
    setObservation(existingOrder.observation ?? "");
    setPrintedItemQuantities(existingOrder.printedItemQuantities ?? {});
  }

  const filteredProducts = useMemo(
    () => (selectedCategory ? products?.filter((product: TProduct) => product.category.id === selectedCategory.id) : products),
    [products, selectedCategory],
  );

  function handleCategoryClick(categoryId: number) {
    const category = categories?.find((cat: TCategory) => cat.id === categoryId);

    setSelectedCategory(category || null);
  }

  if (categories?.length && !selectedCategory) {
    const defaultCategory = categories.find((category: TCategory) => category.id === 1) ?? categories[0];

    setSelectedCategory(defaultCategory);
  }

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

  function getAvailableStock(product: TProduct) {
    if (!product.trackStock) {
      return null;
    }

    const inCart = currentOrder?.orderItems.find((item) => item.product.id === product.id)?.quantity ?? 0;

    return product.quantity - inCart;
  }

  async function handleAddProduct(product: TProduct) {
    const available = getAvailableStock(product);

    if (available !== null && available <= 0) {
      setStockError(`Estoque insuficiente para "${product.name}".`);

      return;
    }

    setStockError(null);

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
          isTakeout: false,
          operatorName: null,
          paymentMethod: null,
          amountReceived: null,
          changeDue: null,
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

    try {
      const updatedOrder = await addOrderItem.mutateAsync({
        orderId: currentOrder.id,
        productId: product.id,
        quantity: 1,
      });

      setCurrentOrder(updatedOrder);
    } catch (error) {
      setStockError(error instanceof Error ? error.message : "Não foi possível adicionar o item.");
    }
  }

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

  function isNameTaken(name: string) {
    const normalized = name.trim().toLowerCase();

    return orders.some(
      (order) =>
        order.id !== currentOrder?.id && order.status !== "PAID" && order.customerName.trim().toLowerCase() === normalized,
    );
  }

  function handleRequestSendOrder() {
    if (!currentOrder || currentOrder.orderItems.length === 0 || isSendingOrder) {
      return;
    }

    if (currentOrder.customerName.trim()) {
      void sendOrder(currentOrder.customerName);

      return;
    }

    setCustomerNameDraft("");
    setNameError(null);
    setIsTakeoutDraft(false);
    setIsNameDialogOpen(true);
  }

  function handleCustomerNameDraftChange(value: string) {
    setCustomerNameDraft(value);
    setNameError(null);
  }

  async function handleConfirmCustomerName() {
    const trimmedName = customerNameDraft.trim();

    if (!trimmedName) {
      return;
    }

    if (isNameTaken(trimmedName)) {
      setNameError("Já existe uma comanda aberta com esse nome.");

      return;
    }

    setNameError(null);
    setIsNameDialogOpen(false);

    await sendOrder(trimmedName, isTakeoutDraft);
  }

  async function sendOrder(customerName: string, isTakeout?: boolean) {
    if (!currentOrder || currentOrder.orderItems.length === 0 || sendingOrderRef.current) {
      return;
    }

    sendingOrderRef.current = true;
    setIsSendingOrder(true);

    try {
      let order = currentOrder;

      if (isDraftOrder(order)) {
        const created = await createOrder.mutateAsync({ customerName, operatorName: getActiveOperator()?.name });

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
        isTakeout,
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

      schedulePrint(updatedOrder.id, printedQty, () => router.push("/order-detail"));
    } catch (error) {
      setStockError(error instanceof Error ? error.message : "Não foi possível enviar o pedido.");
    } finally {
      sendingOrderRef.current = false;
      setIsSendingOrder(false);
    }
  }

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

      <section className="flex flex-col md:flex-row md:h-full print:hidden">
        <OrderPanel
          categories={categories || []}
          selectedCategory={selectedCategory}
          handleCategoryClick={handleCategoryClick}
          filteredProducts={filteredProducts}
          onAddProduct={handleAddProduct}
          order={currentOrder}
          stockError={stockError}
        />

        <Separator className="h-px bg-border md:hidden" />
        <Separator orientation="vertical" className="hidden md:block w-px bg-border" />

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
            onCustomerNameDraftChange={handleCustomerNameDraftChange}
            onConfirmCustomerName={handleConfirmCustomerName}
            nameError={nameError}
            isTakeoutDraft={isTakeoutDraft}
            onIsTakeoutDraftChange={setIsTakeoutDraft}
          />
        )}
      </section>
    </>
  );
}
