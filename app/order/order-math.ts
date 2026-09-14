import { TOrderItem, TOrderResponse, TProduct } from "./interface";

export const DRAFT_ORDER_ID = 0;

export const TAKEOUT_FEE = 2;

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

export function computeOrderTotal(items: TOrderItem[], isTakeout?: boolean): number {
  const itemsTotal = items.reduce((total, item) => total + item.subtotal, 0);

  return isTakeout ? itemsTotal + TAKEOUT_FEE : itemsTotal;
}

export function computeChangeDue(amountReceived: number, total: number): number {
  return Math.max(amountReceived - total, 0);
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
      product: { id: product.id, name: product.name },
      quantity,
      unitPrice: product.price,
      costPrice: product.costPrice ?? 0,
      subtotal: product.price * quantity,
    },
  ];
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
