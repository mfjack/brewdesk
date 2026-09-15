"use client";

import { useMemo, useRef, useState } from "react";

import { MenuList } from "./menu-list";
import { OrderPanel } from "./order-panel";
import { Separator } from "@/_components/ui/separator";

import { useGetCategories } from "../../category/query/useGetCategories";
import { useGetProducts } from "../../product/query/useGetProducts";
import { useGetSupplyItems } from "../../stock/query/useGetSupplyItems";
import { useGetOrders } from "../query/useGetOrders";
import { useGetSettings } from "../../settings/query/useGetSettings";

import { useCreateOrder } from "../mutation/useCreateOrder";
import { useAddOrderItem } from "../mutation/useAddOrderItem";
import { useRemoveOrderItem } from "../mutation/useRemoveOrderItem";
import { useUpdateOrderStatus } from "../mutation/useUpdateOrderStatus";
import { useMarkOrderItemsPrinted } from "../mutation/useMarkOrderItemsPrinted";
import { useDeleteOrder } from "../../order-detail/mutation/useDeleteOrder";

import { TCategory, TOrderItem, TOrderPayment, TOrderResponse, TPaymentMethod, TProduct } from "../interface";
import {
  buildOrderPayment,
  computeOrderTotal,
  decrementOrRemoveItem,
  DRAFT_ORDER_ID,
  getGroupedOrders,
  isDraftOrder,
  isOrderPaid,
  mergeOrderItem,
} from "../order-math";
import { getActiveOperator } from "@/_lib/operator-session";
import { buildReservedSupplyQuantities, getMaxProducibleQuantity } from "@/_lib/recipe-cost";
import { useIsHydrated } from "@/_lib/use-is-hydrated";
import { findOpenFiadoOrders } from "@/_lib/fiado";

import { useRouter, useSearchParams } from "next/navigation";
import { useGetOrderById } from "../query/useGetOrderById";
import { OrderReceipt } from "@/app/(app)/order/_components/order-receipt";

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

  const [groupWithOrderId, setGroupWithOrderId] = useState<number | null>(null);

  const [nameError, setNameError] = useState<string | null>(null);

  const [stockError, setStockError] = useState<string | null>(null);

  const [isSendingOrder, setIsSendingOrder] = useState(false);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const [isSplitOpen, setIsSplitOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<TPaymentMethod>("CREDIT");

  const [amountReceived, setAmountReceived] = useState("");

  const [fiadoCustomerName, setFiadoCustomerName] = useState("");
  const [fiadoTargetOrderId, setFiadoTargetOrderId] = useState<number | null>(null);

  function handleFiadoCustomerNameChange(value: string) {
    setFiadoCustomerName(value);
    setFiadoTargetOrderId(null);
  }

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);

  const [isResendingFullOrder, setIsResendingFullOrder] = useState(false);

  const sendingOrderRef = useRef(false);

  const { data: categories } = useGetCategories();
  const { data: products } = useGetProducts();
  const { data: supplyItems } = useGetSupplyItems();
  const { data: orders = [] } = useGetOrders();
  const { data: settings } = useGetSettings();

  const createOrder = useCreateOrder();
  const addOrderItem = useAddOrderItem();
  const removeOrderItem = useRemoveOrderItem();
  const updateOrderStatus = useUpdateOrderStatus();
  const markOrderItemsPrinted = useMarkOrderItemsPrinted();
  const deleteOrder = useDeleteOrder();

  const { data: existingOrder } = useGetOrderById(orderId ? Number(orderId) : null);

  if (existingOrder && existingOrder.id !== syncedOrderId) {
    setSyncedOrderId(existingOrder.id);
    setCurrentOrder(existingOrder);
    setObservation(existingOrder.observation ?? "");
    setPrintedItemQuantities(existingOrder.printedItemQuantities ?? {});
  }

  const isHydrated = useIsHydrated();
  const defaultCategory =
    isHydrated && categories?.length ? (categories.find((category: TCategory) => category.id === 1) ?? categories[0]) : null;
  const effectiveCategory = selectedCategory ?? defaultCategory;

  const filteredProducts = useMemo(
    () => (effectiveCategory ? products?.filter((product: TProduct) => product.category.id === effectiveCategory.id) : products),
    [products, effectiveCategory],
  );

  const openFiadoMatches =
    paymentMethod === "FIADO" && currentOrder && isDraftOrder(currentOrder) ? findOpenFiadoOrders(orders, fiadoCustomerName) : [];

  const groupableOrders = orders
    .filter((order) => !isOrderPaid(order) && order.status !== "OPEN" && order.id !== currentOrder?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const groupedOrders = currentOrder ? getGroupedOrders(currentOrder, orders) : [];

  function handleCategoryClick(categoryId: number) {
    const category = categories?.find((cat: TCategory) => cat.id === categoryId);

    setSelectedCategory(category || null);
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

  async function materializeDraftOrder(draftOrder: TOrderResponse, customerName: string): Promise<TOrderResponse> {
    const created = await createOrder.mutateAsync({ customerName, operatorName: getActiveOperator()?.name });

    let order = created;

    for (const item of draftOrder.orderItems) {
      order = await addOrderItem.mutateAsync({
        orderId: created.id,
        productId: item.product.id,
        quantity: item.quantity,
      });
    }

    return order;
  }

  async function mergeIntoExistingFiadoOrder(existingOrder: TOrderResponse, newItems: TOrderItem[]): Promise<TOrderResponse> {
    let order = existingOrder;

    for (const item of newItems) {
      order = await addOrderItem.mutateAsync({
        orderId: existingOrder.id,
        productId: item.product.id,
        quantity: item.quantity,
      });
    }

    return updateOrderStatus.mutateAsync({
      orderId: order.id,
      status: "PAID",
      payments: [buildOrderPayment("FIADO", order.total)],
    });
  }

  function computeAvailableStock(product: TProduct, orderItems: TOrderItem[], reservedQuantities: Record<number, number> = {}) {
    if (product.recipe.length > 0) {
      return getMaxProducibleQuantity(product.recipe, supplyItems ?? [], reservedQuantities);
    }

    if (!product.trackStock) {
      return null;
    }

    const inCart = orderItems.find((item) => item.product.id === product.id)?.quantity ?? 0;

    return product.quantity - inCart;
  }

  function getAvailableStock(product: TProduct) {
    return computeAvailableStock(product, currentOrder?.orderItems ?? []);
  }

  function handleAddProduct(product: TProduct) {
    if (!currentOrder || isDraftOrder(currentOrder)) {
      let blockedMessage: string | null = null;

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
          payments: [],
          groupId: null,
          fiadoSettledAt: null,
        };

        const reservedQuantities = buildReservedSupplyQuantities(base.orderItems, products ?? []);
        const available = computeAvailableStock(product, base.orderItems, reservedQuantities);

        if (available !== null && available <= 0) {
          blockedMessage = `Estoque insuficiente para "${product.name}".`;

          return prev;
        }

        const orderItems = mergeOrderItem(base.orderItems, product, 1, () => product.id);

        return {
          ...base,
          orderItems,
          total: computeOrderTotal(orderItems, base.isTakeout, settings?.takeoutFee),
        };
      });

      setStockError(blockedMessage);

      return;
    }

    const available = getAvailableStock(product);

    if (available !== null && available <= 0) {
      setStockError(`Estoque insuficiente para "${product.name}".`);

      return;
    }

    setStockError(null);

    const previousOrder = currentOrder;
    const orderItems = mergeOrderItem(currentOrder.orderItems, product, 1, () => product.id);

    setCurrentOrder({
      ...currentOrder,
      orderItems,
      total: computeOrderTotal(orderItems, currentOrder.isTakeout, settings?.takeoutFee),
    });

    addOrderItem.mutate(
      { orderId: currentOrder.id, productId: product.id, quantity: 1 },
      {
        onSuccess: (updatedOrder) => setCurrentOrder(updatedOrder),
        onError: (error) => {
          setCurrentOrder(previousOrder);
          setStockError(error instanceof Error ? error.message : "Não foi possível adicionar o item.");
        },
      },
    );
  }

  function handleRemoveItem(itemId: number) {
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
          total: computeOrderTotal(orderItems, currentOrder.isTakeout, settings?.takeoutFee),
        });
      }

      return;
    }

    const previousOrder = currentOrder;
    const previousPrintedItemQuantities = printedItemQuantities;

    const orderItems = decrementOrRemoveItem(currentOrder.orderItems, itemId);
    const updatedPrintedQuantities = { ...printedItemQuantities };
    const remainingItem = orderItems.find((item) => item.id === itemId);

    if (remainingItem) {
      updatedPrintedQuantities[itemId] = Math.min(updatedPrintedQuantities[itemId] ?? 0, remainingItem.quantity);
    } else {
      delete updatedPrintedQuantities[itemId];
    }

    setCurrentOrder({
      ...currentOrder,
      orderItems,
      total: computeOrderTotal(orderItems, currentOrder.isTakeout, settings?.takeoutFee),
    });
    setPrintedItemQuantities(updatedPrintedQuantities);

    removeOrderItem.mutate(
      { orderId: currentOrder.id, itemId },
      {
        onSuccess: (updatedOrder) => {
          setCurrentOrder(updatedOrder);
          setPrintedItemQuantities(updatedOrder.printedItemQuantities ?? {});
        },
        onError: (error) => {
          setCurrentOrder(previousOrder);
          setPrintedItemQuantities(previousPrintedItemQuantities);
          setStockError(error instanceof Error ? error.message : "Não foi possível remover o item.");
        },
      },
    );
  }

  function isNameTaken(name: string) {
    const normalized = name.trim().toLowerCase();

    return orders.some(
      (order) => order.id !== currentOrder?.id && !isOrderPaid(order) && order.customerName.trim().toLowerCase() === normalized,
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
    setGroupWithOrderId(null);
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

    await sendOrder(trimmedName, isTakeoutDraft, groupWithOrderId);
  }

  async function sendOrder(customerName: string, isTakeout?: boolean, groupWithOrderId?: number | null) {
    if (!currentOrder || currentOrder.orderItems.length === 0 || sendingOrderRef.current) {
      return;
    }

    sendingOrderRef.current = true;
    setIsSendingOrder(true);

    try {
      const order = isDraftOrder(currentOrder) ? await materializeDraftOrder(currentOrder, customerName) : currentOrder;

      const updatedOrder = await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: "PENDING",
        observation,
        customerName,
        isTakeout,
        groupWithOrderId,
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

      schedulePrint(updatedOrder.id, printedQty, () => resetCart());
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

  function clearCartState() {
    setCurrentOrder(null);
    setObservation("");
    setPrintedItemQuantities({});
    setSyncedOrderId(null);
  }

  function resetCart() {
    clearCartState();
    router.replace("/order");
  }

  async function handleResendFullOrder() {
    if (!currentOrder || isDraftOrder(currentOrder) || currentOrder.orderItems.length === 0 || isResendingFullOrder) {
      return;
    }

    setIsResendingFullOrder(true);

    try {
      if (currentOrder.status !== "PENDING") {
        await updateOrderStatus.mutateAsync({ orderId: currentOrder.id, status: "PENDING" });
      }

      const printedQty: Record<number, number> = {};

      currentOrder.orderItems.forEach((item: TOrderItem) => {
        printedQty[item.id] = item.quantity;
      });

      const orderForPrint: TOrderResponse = { ...currentOrder, status: "PENDING", printedItemQuantities: printedQty };

      setCurrentOrder(orderForPrint);
      setPrintedItemQuantities(printedQty);
      setIsEditOrderDialogOpen(false);
      setPrintJob({ order: orderForPrint, mode: "full" });

      schedulePrint(currentOrder.id, printedQty);
    } catch (error) {
      setStockError(error instanceof Error ? error.message : "Não foi possível reenviar o pedido.");
    } finally {
      setIsResendingFullOrder(false);
    }
  }

  function handleRequestCancelOrder() {
    if (!currentOrder || isDraftOrder(currentOrder) || isSendingOrder) {
      return;
    }

    setIsCancelDialogOpen(true);
  }

  async function handleConfirmCancelOrder() {
    if (!currentOrder || isDraftOrder(currentOrder)) {
      return;
    }

    try {
      await deleteOrder.mutateAsync({ orderId: currentOrder.id });

      setIsCancelDialogOpen(false);
      clearCartState();
      router.push("/order-detail");
    } catch (error) {
      setStockError(error instanceof Error ? error.message : "Não foi possível cancelar a comanda.");
    }
  }

  function handleRequestPayment() {
    if (!currentOrder || currentOrder.orderItems.length === 0 || isSendingOrder) {
      return;
    }

    setPaymentMethod("CREDIT");
    setAmountReceived("");
    setFiadoCustomerName(currentOrder.customerName ?? "");
    setFiadoTargetOrderId(null);
    setIsSplitOpen(false);
    setIsPaymentDialogOpen(true);
  }

  async function handleConfirmPayment() {
    if (!currentOrder || currentOrder.orderItems.length === 0 || sendingOrderRef.current) {
      return;
    }

    if (paymentMethod === "FIADO" && !fiadoCustomerName.trim()) {
      return;
    }

    sendingOrderRef.current = true;
    setIsSendingOrder(true);

    try {
      const targetFiadoOrder =
        paymentMethod === "FIADO" && fiadoTargetOrderId
          ? openFiadoMatches.find((order) => order.id === fiadoTargetOrderId)
          : undefined;

      if (targetFiadoOrder) {
        await mergeIntoExistingFiadoOrder(targetFiadoOrder, currentOrder.orderItems);

        setIsPaymentDialogOpen(false);
        resetCart();

        return;
      }

      const customerName = paymentMethod === "FIADO" ? fiadoCustomerName : "";
      const order = isDraftOrder(currentOrder) ? await materializeDraftOrder(currentOrder, customerName) : currentOrder;

      await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: "PAID",
        observation,
        ...(paymentMethod === "FIADO" ? { customerName: fiadoCustomerName } : {}),
        payments: [buildOrderPayment(paymentMethod, order.total, Number(amountReceived) || 0)],
      });

      setIsPaymentDialogOpen(false);
      resetCart();
    } catch (error) {
      setStockError(error instanceof Error ? error.message : "Não foi possível concluir o pagamento.");
    } finally {
      sendingOrderRef.current = false;
      setIsSendingOrder(false);
    }
  }

  async function handleConfirmSplitPayment(payments: TOrderPayment[]) {
    if (!currentOrder || currentOrder.orderItems.length === 0 || sendingOrderRef.current) {
      return;
    }

    sendingOrderRef.current = true;
    setIsSendingOrder(true);

    try {
      const order = isDraftOrder(currentOrder) ? await materializeDraftOrder(currentOrder, "") : currentOrder;

      await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: "PAID",
        observation,
        payments,
      });

      setIsPaymentDialogOpen(false);
      setIsSplitOpen(false);
      resetCart();
    } catch (error) {
      setStockError(error instanceof Error ? error.message : "Não foi possível concluir o pagamento.");
    } finally {
      sendingOrderRef.current = false;
      setIsSendingOrder(false);
    }
  }

  return (
    <>
      {printJob && (
        <OrderReceipt
          order={printJob.order}
          observation={observation}
          printMode={printJob.mode}
          printedItemQuantities={printedItemQuantities}
          groupedCustomerNames={getGroupedOrders(printJob.order, orders).map((groupedOrder) => groupedOrder.customerName)}
        />
      )}

      <section className="flex flex-col md:flex-row md:h-full print:hidden">
        <OrderPanel
          categories={isHydrated ? categories || [] : []}
          selectedCategory={effectiveCategory}
          handleCategoryClick={handleCategoryClick}
          filteredProducts={isHydrated ? filteredProducts : undefined}
          products={isHydrated ? products : undefined}
          supplyItems={isHydrated ? supplyItems : undefined}
          onAddProduct={handleAddProduct}
          order={currentOrder}
          stockError={stockError}
          listLayout={!(settings?.featureFlags.orderTickets ?? true)}
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
            groupableOrders={groupableOrders}
            groupWithOrderId={groupWithOrderId}
            onGroupWithOrderIdChange={setGroupWithOrderId}
            groupedOrders={groupedOrders}
            onRequestPayment={handleRequestPayment}
            isPaymentDialogOpen={isPaymentDialogOpen}
            onPaymentDialogOpenChange={setIsPaymentDialogOpen}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            amountReceived={amountReceived}
            onAmountReceivedChange={setAmountReceived}
            fiadoCustomerName={fiadoCustomerName}
            onFiadoCustomerNameChange={handleFiadoCustomerNameChange}
            openFiadoMatches={openFiadoMatches}
            fiadoTargetOrderId={fiadoTargetOrderId}
            onFiadoTargetOrderIdChange={setFiadoTargetOrderId}
            onConfirmPayment={handleConfirmPayment}
            isConfirmingPayment={isSendingOrder}
            isSplitOpen={isSplitOpen}
            onSplitOpenChange={setIsSplitOpen}
            onConfirmSplitPayment={handleConfirmSplitPayment}
            onRequestCancelOrder={handleRequestCancelOrder}
            isCancelDialogOpen={isCancelDialogOpen}
            onCancelDialogOpenChange={setIsCancelDialogOpen}
            onConfirmCancelOrder={handleConfirmCancelOrder}
            isCancelling={deleteOrder.isPending}
            categories={categories || []}
            selectedCategory={effectiveCategory}
            onCategoryClick={handleCategoryClick}
            filteredProducts={filteredProducts}
            products={products}
            supplyItems={supplyItems}
            onAddProduct={handleAddProduct}
            stockError={stockError}
            isEditOrderDialogOpen={isEditOrderDialogOpen}
            onEditOrderDialogOpenChange={setIsEditOrderDialogOpen}
            onResendFullOrder={handleResendFullOrder}
            isResendingFullOrder={isResendingFullOrder}
          />
        )}
      </section>
    </>
  );
}
