"use client";

import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";

import { MenuList } from "./menu-list";
import { OrderPanel } from "./order-panel";
import { Separator } from "@/_components/ui/separator";

import { useGetCategories } from "../../category/query/useGetCategories";
import { useGetProducts } from "../../product/query/useGetProducts";
import { useGetSupplyItems } from "../../stock/query/useGetSupplyItems";
import { useGetOrders } from "../query/useGetOrders";
import { useGetSettings } from "../../settings/query/useGetSettings";

import { useCreateOrderWithItems } from "../mutation/useCreateOrderWithItems";
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
  getKitchenGroupedOrders,
  isDraftOrder,
  isOrderPaid,
  mergeOrderItem,
  splitPaymentsAcrossOrders,
} from "../order-math";
import { getActiveOperator, useIsSelfServiceOperator } from "@/_lib/operator-session";
import { buildReservedSupplyQuantities, getMaxProducibleQuantity } from "@/_lib/recipe-cost";
import { useHydratedData, useIsHydrated } from "@/_lib/use-is-hydrated";

import { useRouter, useSearchParams } from "next/navigation";
import { useGetOrderById } from "../query/useGetOrderById";
import { OrderReceipt } from "@/app/(app)/order/_components/order-receipt";
import { buildReceiptBytes } from "@/_lib/receipt-encoder";
import { isThermalPrintingEnabled, printThermalReceipt } from "@/_lib/thermal-printer";

type PrintJob = {
  order: TOrderResponse;
  mode: "full" | "additional";
  // "Junto com" (kitchenGroupId) orders — printed as their own sections on this same ticket.
  additionalOrders?: TOrderResponse[];
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
  const [nameDialogIntent, setNameDialogIntent] = useState<"send" | "payment">("send");

  const [customerNameDraft, setCustomerNameDraft] = useState("");

  const [isTakeoutDraft, setIsTakeoutDraft] = useState(false);

  // "Junto com": a second person's cart, built alongside the primary one in this same PDV
  // session — sent as its own separate order (kitchen-linked to the primary) once "Imprimir
  // pedido" runs, so each keeps its own payment despite being built and printed together.
  const [secondaryCustomerName, setSecondaryCustomerName] = useState("");
  const [secondaryOrderItems, setSecondaryOrderItems] = useState<TOrderItem[]>([]);
  const [activeCartTarget, setActiveCartTarget] = useState<"primary" | "secondary">("primary");
  const [isJuntoComDialogOpen, setIsJuntoComDialogOpen] = useState(false);
  const [juntoComNameDraft, setJuntoComNameDraft] = useState("");

  const [nameError, setNameError] = useState<string | null>(null);

  const [stockError, setStockError] = useState<string | null>(null);

  const [isSendingOrder, setIsSendingOrder] = useState(false);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const [isSplitOpen, setIsSplitOpen] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<TPaymentMethod | null>(null);

  const [amountReceived, setAmountReceived] = useState("");

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);

  const [isResendingFullOrder, setIsResendingFullOrder] = useState(false);

  const sendingOrderRef = useRef(false);
  const [clearedOrderId, setClearedOrderId] = useState<number | null>(null);
  const openedPaymentAfterSendRef = useRef(false);

  const { data: categories } = useGetCategories();
  const { data: products } = useGetProducts();
  const { data: supplyItems } = useGetSupplyItems();
  const { data: orders = [] } = useGetOrders();
  const { data: settings } = useGetSettings();
  const isSelfServiceEnabled = useIsSelfServiceOperator(settings?.operators);

  const createOrderWithItems = useCreateOrderWithItems();
  const addOrderItem = useAddOrderItem();
  const removeOrderItem = useRemoveOrderItem();
  const updateOrderStatus = useUpdateOrderStatus();
  const markOrderItemsPrinted = useMarkOrderItemsPrinted();
  const deleteOrder = useDeleteOrder();

  const { data: existingOrder } = useGetOrderById(orderId ? Number(orderId) : null);

  if (existingOrder && existingOrder.id !== syncedOrderId && existingOrder.id !== clearedOrderId && !isOrderPaid(existingOrder)) {
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
  const hydratedProducts = useHydratedData(products);
  const hydratedSupplyItems = useHydratedData(supplyItems);
  const hydratedFilteredProducts = useHydratedData(filteredProducts);

  const isOrderGroupingEnabled = settings?.featureFlags.orderGrouping ?? true;

  const groupedOrders = useMemo(
    () => (currentOrder && isOrderGroupingEnabled ? getGroupedOrders(currentOrder, orders) : []),
    [currentOrder, orders, isOrderGroupingEnabled],
  );

  const kitchenGroupedOrders = useMemo(
    () => (currentOrder && isOrderGroupingEnabled ? getKitchenGroupedOrders(currentOrder, orders) : []),
    [currentOrder, orders, isOrderGroupingEnabled],
  );

  // "Junto com" comandas stay separate database records (each keeps its own id, kitchen
  // ticket and history) but pay as one: this synthetic order is what the payment dialog and
  // split-bill calculator actually display and charge against.
  const paymentOrders = useMemo(() => (currentOrder ? [currentOrder, ...groupedOrders] : []), [currentOrder, groupedOrders]);

  const combinedPaymentOrder: TOrderResponse | null = useMemo(() => {
    if (paymentOrders.length === 0) {
      return null;
    }

    if (paymentOrders.length === 1) {
      return paymentOrders[0];
    }

    return {
      ...paymentOrders[0],
      customerName: paymentOrders.map((order) => order.customerName).join(" + "),
      isTakeout: false,
      total: paymentOrders.reduce((sum, order) => sum + order.total, 0),
      orderItems: paymentOrders.flatMap((order, orderIndex) =>
        order.orderItems.map((item) => ({ ...item, id: orderIndex * 10000 + item.id })),
      ),
    };
  }, [paymentOrders]);

  // "Junto com" orders print together on the same physical ticket, in "full" mode only —
  // an "additional" (reprint-new-items) job shouldn't re-print the whole linked order again.
  function getAdditionalOrdersForPrint(order: TOrderResponse, mode: "full" | "additional"): TOrderResponse[] {
    return mode === "full" && isOrderGroupingEnabled ? getKitchenGroupedOrders(order, orders) : [];
  }

  function handleCategoryClick(categoryId: number) {
    const category = categories?.find((cat: TCategory) => cat.id === categoryId);

    setSelectedCategory(category || null);
  }

  // The receipt DOM only needs to exist for the browser-print fallback below (thermal
  // printing builds its bytes straight from `order`, no render involved), and the caller
  // just set printJob via a flushSync'd setPrintJob — so by the time we get here the
  // <OrderReceipt> is already committed and window.print() has real content to capture.
  function schedulePrint(
    order: TOrderResponse,
    mode: "full" | "additional",
    printedQty: Record<number, number>,
    onAfterPrint?: () => void,
    additionalOrders: TOrderResponse[] = [],
  ) {
    void (async () => {
      let printedViaThermal = false;

      if (isThermalPrintingEnabled()) {
        try {
          // Uses the order's own (pre-this-print) printedItemQuantities, not the already
          // "everything's printed now" printedQty below — passing printedQty here made
          // additional-item prints always compute zero new lines, since every item already
          // matched its own just-updated printed count.
          const bytes = buildReceiptBytes({
            order,
            settings,
            observation,
            printMode: mode,
            printedItemQuantities: order.printedItemQuantities,
            additionalOrders,
          });

          if (bytes) {
            await printThermalReceipt(bytes);
            printedViaThermal = true;
          }
        } catch (error) {
          const message = `Não foi possível imprimir na impressora térmica${error instanceof Error ? ` (${error.message})` : ""}. Imprimindo pelo navegador.`;

          setStockError(message);
          toast.error(message);
        }
      }

      if (!printedViaThermal) {
        window.print();
      }

      await markOrderItemsPrinted.mutateAsync({
        orderId: order.id,
        printedItemQuantities: printedQty,
      });

      if (printedViaThermal) {
        toast.success("Recibo impresso com sucesso!");
      }

      onAfterPrint?.();
      setPrintJob(null);
    })();
  }

  async function materializeOrder(orderItems: TOrderItem[], customerName: string, isTakeout = false): Promise<TOrderResponse> {
    return createOrderWithItems.mutateAsync({
      customerName,
      operatorName: getActiveOperator()?.name,
      items: orderItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      isTakeout,
    });
  }

  // Prints a receipt for an order that's already been resolved (paid/registered), so it
  // doesn't go through schedulePrint's printedItemQuantities/markOrderItemsPrinted bookkeeping
  // — that tracking is for reprinting a still-open order's unprinted lines later, which no
  // longer applies once the sale is closed out.
  function printReceiptOnly(order: TOrderResponse) {
    flushSync(() => setPrintJob({ order, mode: "full" }));

    void (async () => {
      let printedViaThermal = false;

      if (isThermalPrintingEnabled()) {
        try {
          const bytes = buildReceiptBytes({ order, settings, printMode: "full" });

          if (bytes) {
            await printThermalReceipt(bytes);
          }

          printedViaThermal = true;
        } catch (error) {
          const message = `Não foi possível imprimir na impressora térmica${error instanceof Error ? ` (${error.message})` : ""}. Imprimindo pelo navegador.`;

          setStockError(message);
          toast.error(message);
        }
      }

      if (!printedViaThermal) {
        window.print();
      } else {
        toast.success("Recibo impresso com sucesso!");
      }

      setPrintJob(null);
    })();
  }

  async function handleRegisterConta() {
    const trimmedName = customerNameDraft.trim();

    if (!trimmedName || !currentOrder || sendingOrderRef.current) {
      return;
    }

    setNameError(null);
    setIsNameDialogOpen(false);
    const shouldPrint = nameDialogIntent === "send";

    sendingOrderRef.current = true;
    setIsSendingOrder(true);

    try {
      const order = isDraftOrder(currentOrder)
        ? await materializeOrder(currentOrder.orderItems, trimmedName, isTakeoutDraft)
        : currentOrder;

      const paidOrder = await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: "PAID",
        customerName: trimmedName,
        payments: [buildOrderPayment("CONTA", order.total)],
      });

      if (shouldPrint) {
        printReceiptOnly(paidOrder);
      }

      resetCart();
      toast.success("Registrado na conta com sucesso!");
    } catch (error) {
      setStockError(error instanceof Error ? error.message : "Não foi possível registrar a conta.");
    } finally {
      sendingOrderRef.current = false;
      setIsSendingOrder(false);
    }
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
    if (activeCartTarget === "secondary") {
      let blockedMessage: string | null = null;

      setSecondaryOrderItems((prev) => {
        const reservedQuantities = buildReservedSupplyQuantities(prev, products ?? []);
        const available = computeAvailableStock(product, prev, reservedQuantities);

        if (available !== null && available <= 0) {
          blockedMessage = `Estoque insuficiente para "${product.name}".`;

          return prev;
        }

        return mergeOrderItem(prev, product, 1, () => product.id);
      });

      setStockError(blockedMessage);

      return;
    }

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
          kitchenGroupId: null,
          contaSettledAt: null,
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
    setNameDialogIntent("send");
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

    if (nameDialogIntent === "payment") {
      setCurrentOrder((prev) =>
        prev
          ? {
              ...prev,
              customerName: trimmedName,
              isTakeout: isTakeoutDraft,
              total: computeOrderTotal(prev.orderItems, isTakeoutDraft, settings?.takeoutFee),
            }
          : prev,
      );
      openPaymentDialog();

      return;
    }

    await sendOrder(trimmedName, isTakeoutDraft);
  }

  async function sendOrder(customerName: string, isTakeout?: boolean) {
    if (!currentOrder || currentOrder.orderItems.length === 0 || sendingOrderRef.current) {
      return;
    }

    sendingOrderRef.current = true;
    setIsSendingOrder(true);

    try {
      const order = isDraftOrder(currentOrder)
        ? await materializeOrder(currentOrder.orderItems, customerName, isTakeout)
        : currentOrder;

      // "Junto com": the second person's cart built alongside this one becomes its own real
      // order here, kitchen-linked to this one (never for payment) — created before this
      // order's own update so that update can set the link in the same call.
      const hasSecondaryCart = secondaryCustomerName.trim().length > 0 && secondaryOrderItems.length > 0;

      const secondaryOrder = hasSecondaryCart ? await materializeOrder(secondaryOrderItems, secondaryCustomerName) : null;

      const updatedOrder = await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: "PENDING",
        observation,
        customerName,
        isTakeout,
        kitchenGroupWithOrderId: secondaryOrder?.id,
      });

      const updatedSecondaryOrder = secondaryOrder
        ? await updateOrderStatus.mutateAsync({ orderId: secondaryOrder.id, status: "PENDING" })
        : null;

      const printedQty: Record<number, number> = {};

      updatedOrder.orderItems.forEach((item: TOrderItem) => {
        printedQty[item.id] = item.quantity;
      });

      const orderWithPrintedItems: TOrderResponse = {
        ...updatedOrder,
        printedItemQuantities: printedQty,
      };

      const additionalOrders = updatedSecondaryOrder
        ? [updatedSecondaryOrder]
        : getAdditionalOrdersForPrint(orderWithPrintedItems, "full");

      setCurrentOrder(orderWithPrintedItems);
      setPrintedItemQuantities(printedQty);
      setSecondaryCustomerName("");
      setSecondaryOrderItems([]);
      setActiveCartTarget("primary");

      // Forces the <OrderReceipt> for this job to commit to the DOM before schedulePrint
      // runs, so window.print() has real content instead of racing an arbitrary delay.
      flushSync(() => setPrintJob({ order: orderWithPrintedItems, mode: "full", additionalOrders }));

      toast.success("Pedido enviado com sucesso!");

      schedulePrint(
        orderWithPrintedItems,
        "full",
        printedQty,
        isSelfServiceEnabled ? () => resetCart() : () => handleRequestPaymentAfterSend(),
        additionalOrders,
      );
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

    const orderForAdditionalPrint = { ...currentOrder, printedItemQuantities: printedItemQuantities };

    flushSync(() => setPrintJob({ order: orderForAdditionalPrint, mode: "additional" }));

    schedulePrint(orderForAdditionalPrint, "additional", printedQty, () => setPrintedItemQuantities(printedQty));
  }

  function clearCartState() {
    setClearedOrderId(currentOrder?.id ?? null);
    setCurrentOrder(null);
    setObservation("");
    setPrintedItemQuantities({});
    setSyncedOrderId(null);
    setSecondaryCustomerName("");
    setSecondaryOrderItems([]);
    setActiveCartTarget("primary");
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
      const additionalOrders = getAdditionalOrdersForPrint(orderForPrint, "full");

      setCurrentOrder(orderForPrint);
      setPrintedItemQuantities(printedQty);
      setIsEditOrderDialogOpen(false);
      flushSync(() => setPrintJob({ order: orderForPrint, mode: "full", additionalOrders }));

      schedulePrint(orderForPrint, "full", printedQty, undefined, additionalOrders);

      toast.success("Pedido reenviado com sucesso!");
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

    setStockError(null);
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
      toast.success("Comanda cancelada com sucesso!");
    } catch (error) {
      setStockError(error instanceof Error ? error.message : "Não foi possível cancelar a comanda.");
    }
  }

  function handleOpenJuntoComDialog() {
    setJuntoComNameDraft(secondaryCustomerName);
    setIsJuntoComDialogOpen(true);
  }

  function handleConfirmJuntoComName() {
    const trimmedName = juntoComNameDraft.trim();

    if (!trimmedName) {
      return;
    }

    setSecondaryCustomerName(trimmedName);
    setActiveCartTarget("secondary");
    setIsJuntoComDialogOpen(false);
  }

  function handleRemoveJuntoCom() {
    setSecondaryCustomerName("");
    setSecondaryOrderItems([]);
    setActiveCartTarget("primary");
    setIsJuntoComDialogOpen(false);
  }

  function handleRemoveSecondaryItem(itemId: number) {
    setSecondaryOrderItems((prev) => decrementOrRemoveItem(prev, itemId));
  }

  function openPaymentDialog() {
    if (!currentOrder || currentOrder.orderItems.length === 0 || isSendingOrder) {
      return;
    }

    setStockError(null);
    setPaymentMethod(null);
    setAmountReceived("");
    setIsSplitOpen(false);
    setIsPaymentDialogOpen(true);
  }

  function handleRequestPayment() {
    openedPaymentAfterSendRef.current = false;

    if (!currentOrder || currentOrder.orderItems.length === 0 || isSendingOrder) {
      return;
    }

    if (currentOrder.customerName.trim()) {
      openPaymentDialog();

      return;
    }

    setCustomerNameDraft("");
    setNameError(null);
    setIsTakeoutDraft(false);
    setNameDialogIntent("payment");
    setIsNameDialogOpen(true);
  }

  function handleRequestPaymentAfterSend() {
    openedPaymentAfterSendRef.current = true;
    openPaymentDialog();
  }

  function handlePaymentDialogOpenChange(open: boolean) {
    setIsPaymentDialogOpen(open);

    if (!open && openedPaymentAfterSendRef.current) {
      openedPaymentAfterSendRef.current = false;
      resetCart();
    }
  }

  function handleEditOrderFromPayment() {
    openedPaymentAfterSendRef.current = false;
    setIsPaymentDialogOpen(false);
    setIsEditOrderDialogOpen(true);
  }

  async function handleConfirmPayment() {
    if (!currentOrder || currentOrder.orderItems.length === 0 || sendingOrderRef.current) {
      return;
    }

    sendingOrderRef.current = true;
    setIsSendingOrder(true);

    try {
      const order = isDraftOrder(currentOrder)
        ? await materializeOrder(currentOrder.orderItems, currentOrder.customerName, currentOrder.isTakeout)
        : currentOrder;

      if (paymentMethod !== null) {
        // Grouped comandas each need their own payment record for their own total — the
        // amount the operator typed only matches the combined total shown in the dialog,
        // so it's only usable as-is when there's a single order being paid.
        const ordersToPay = groupedOrders.length > 0 ? [order, ...groupedOrders] : [order];
        const isCombinedPayment = ordersToPay.length > 1;

        await Promise.all(
          ordersToPay.map((orderToPay) =>
            updateOrderStatus.mutateAsync({
              orderId: orderToPay.id,
              status: "PAID",
              observation: orderToPay.id === order.id ? observation : undefined,
              payments: [
                buildOrderPayment(
                  paymentMethod,
                  orderToPay.total,
                  isCombinedPayment ? orderToPay.total : Number(amountReceived) || 0,
                ),
              ],
            }),
          ),
        );
      } else {
        setCurrentOrder(order);
      }

      setIsPaymentDialogOpen(false);
      resetCart();
      toast.success(paymentMethod !== null ? "Pagamento confirmado com sucesso!" : "Comanda aberta com sucesso!");
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
      const order = isDraftOrder(currentOrder)
        ? await materializeOrder(currentOrder.orderItems, "", currentOrder.isTakeout)
        : currentOrder;

      const ordersToPay = groupedOrders.length > 0 ? [order, ...groupedOrders] : [order];
      const paymentsPerOrder = splitPaymentsAcrossOrders(payments, ordersToPay.map((orderToPay) => orderToPay.total));

      await Promise.all(
        ordersToPay.map((orderToPay, index) =>
          updateOrderStatus.mutateAsync({
            orderId: orderToPay.id,
            status: "PAID",
            observation: orderToPay.id === order.id ? observation : undefined,
            payments: paymentsPerOrder[index],
          }),
        ),
      );

      setIsPaymentDialogOpen(false);
      setIsSplitOpen(false);
      resetCart();
      toast.success("Pagamento confirmado com sucesso!");
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
          additionalOrders={printJob.additionalOrders}
        />
      )}

      <section className="flex flex-col md:flex-row md:h-full print:hidden">
        <OrderPanel
          categories={isHydrated ? categories || [] : []}
          selectedCategory={effectiveCategory}
          handleCategoryClick={handleCategoryClick}
          filteredProducts={hydratedFilteredProducts}
          products={hydratedProducts}
          supplyItems={hydratedSupplyItems}
          onAddProduct={handleAddProduct}
          order={currentOrder}
          stockError={stockError}
          listLayout={!(settings?.featureFlags.orderTickets ?? true)}
          isSelfServiceEnabled={isSelfServiceEnabled}
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
            nameDialogIntent={nameDialogIntent}
            customerNameDraft={customerNameDraft}
            onCustomerNameDraftChange={handleCustomerNameDraftChange}
            onConfirmCustomerName={handleConfirmCustomerName}
            nameError={nameError}
            isTakeoutDraft={isTakeoutDraft}
            onIsTakeoutDraftChange={setIsTakeoutDraft}
            groupedOrders={groupedOrders}
            kitchenGroupedOrders={kitchenGroupedOrders}
            secondaryCustomerName={secondaryCustomerName}
            secondaryOrderItems={secondaryOrderItems}
            onRemoveSecondaryItem={handleRemoveSecondaryItem}
            activeCartTarget={activeCartTarget}
            onSelectCartTarget={setActiveCartTarget}
            isJuntoComDialogOpen={isJuntoComDialogOpen}
            onOpenJuntoComDialog={handleOpenJuntoComDialog}
            onJuntoComDialogOpenChange={setIsJuntoComDialogOpen}
            juntoComNameDraft={juntoComNameDraft}
            onJuntoComNameDraftChange={setJuntoComNameDraft}
            onConfirmJuntoComName={handleConfirmJuntoComName}
            onRemoveJuntoCom={handleRemoveJuntoCom}
            onRegisterConta={handleRegisterConta}
            onRequestPayment={handleRequestPayment}
            isPaymentDialogOpen={isPaymentDialogOpen}
            onPaymentDialogOpenChange={handlePaymentDialogOpenChange}
            onEditOrderFromPayment={handleEditOrderFromPayment}
            isPayingExistingComanda={Boolean(orderId)}
            paymentOrder={combinedPaymentOrder}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            amountReceived={amountReceived}
            onAmountReceivedChange={setAmountReceived}
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
            isSelfServiceEnabled={isSelfServiceEnabled}
          />
        )}
      </section>
    </>
  );
}
