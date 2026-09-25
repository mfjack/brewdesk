import { TOrderItem, TOrderPayment, TOrderResponse, TPaymentMethod, TProduct } from "./interface";

export const DRAFT_ORDER_ID = 0;

export function isDraftOrder(order: TOrderResponse): boolean {
  return order.id === DRAFT_ORDER_ID;
}

export function isOrderPaid(order: TOrderResponse): boolean {
  return order.status === "PAID";
}

export function getGroupedOrders(order: TOrderResponse, allOrders: TOrderResponse[]): TOrderResponse[] {
  if (!order.groupId) {
    return [];
  }

  return allOrders.filter((candidate) => candidate.id !== order.id && candidate.groupId === order.groupId);
}

export function computeOrderTotal(items: TOrderItem[], isTakeout?: boolean, takeoutFee = 0): number {
  const itemsTotal = items.reduce((total, item) => total + item.subtotal, 0);

  return isTakeout ? itemsTotal + takeoutFee : itemsTotal;
}

export function getChargedTakeoutFee(order: TOrderResponse): number {
  if (!order.isTakeout) {
    return 0;
  }

  const itemsTotal = order.orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  return order.total - itemsTotal;
}

export function computeChangeDue(amountReceived: number, total: number): number {
  return Math.max(amountReceived - total, 0);
}

export function buildOrderPayment(method: TPaymentMethod, amount: number, amountReceivedInput?: number | null): TOrderPayment {
  if (method === "CONTA") {
    return { method, amount, amountReceived: null, changeDue: null };
  }

  if (method !== "CASH") {
    return { method, amount, amountReceived: amount, changeDue: 0 };
  }

  const amountReceived = amountReceivedInput ?? 0;

  return { method, amount, amountReceived, changeDue: computeChangeDue(amountReceived, amount) };
}

export function mergeOrderItem(
  items: TOrderItem[],
  product: TProduct,
  quantity: number,
  getNewItemId: () => number,
): TOrderItem[] {
  const existingItem = items.find((item) => item.product.id === product.id);

  if (existingItem) {
    return items.map((item) =>
      item.id === existingItem.id
        ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unitPrice }
        : item,
    );
  }

  return [
    ...items,
    {
      id: getNewItemId(),
      product: { id: product.id, name: product.name, category: { id: product.category.id, name: product.category.name } },
      quantity,
      unitPrice: product.price,
      costPrice: product.costPrice ?? 0,
      subtotal: product.price * quantity,
    },
  ];
}

export interface TReceiptItemGroup {
  categoryName: string | null;
  items: TOrderItem[];
}

// Groups receipt items by category, in the same order categories appear everywhere else
// in the app (creation order, i.e. category id ascending) — so the kitchen ticket always
// prints organized by station regardless of the order the items were added to the cart.
// Items with no category snapshot (orders created before this field existed) land in a
// single "Outros" group at the end.
export function groupItemsByCategory(items: TOrderItem[]): TReceiptItemGroup[] {
  const groupsByCategoryId = new Map<number, { categoryName: string; items: TOrderItem[] }>();
  const uncategorizedItems: TOrderItem[] = [];

  items.forEach((item) => {
    const category = item.product.category;

    if (!category) {
      uncategorizedItems.push(item);
      return;
    }

    const group = groupsByCategoryId.get(category.id) ?? { categoryName: category.name, items: [] };
    group.items.push(item);
    groupsByCategoryId.set(category.id, group);
  });

  const groups: TReceiptItemGroup[] = [...groupsByCategoryId.entries()]
    .sort(([idA], [idB]) => idA - idB)
    .map(([, group]) => group);

  if (uncategorizedItems.length > 0) {
    groups.push({ categoryName: "Outros", items: uncategorizedItems });
  }

  return groups;
}

export function decrementOrRemoveItem(items: TOrderItem[], itemId: number): TOrderItem[] {
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    return items;
  }

  if (item.quantity > 1) {
    return items.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1, subtotal: (i.quantity - 1) * i.unitPrice } : i));
  }

  return items.filter((i) => i.id !== itemId);
}
