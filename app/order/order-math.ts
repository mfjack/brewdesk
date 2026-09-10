import { TOrderItem, TOrderResponse, TProduct } from "./interface";

export const DRAFT_ORDER_ID = 0;

export function isDraftOrder(order: TOrderResponse): boolean {
  return order.id === DRAFT_ORDER_ID;
}

export function computeOrderTotal(items: TOrderItem[]): number {
  return items.reduce((total, item) => total + item.subtotal, 0);
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
      product,
      quantity,
      unitPrice: product.price,
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
