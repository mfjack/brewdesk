import { TOrderItem, TOrderPayment, TOrderResponse, TPaymentMethod, TProduct } from "./interface";

export const DRAFT_ORDER_ID = 0;

export function isDraftOrder(order: TOrderResponse): boolean {
  return order.id === DRAFT_ORDER_ID;
}

export function isOrderPaid(order: TOrderResponse): boolean {
  return order.status === "PAID";
}

function getOrdersSharingGroup(
  order: TOrderResponse,
  allOrders: TOrderResponse[],
  groupIdField: "groupId" | "kitchenGroupId",
): TOrderResponse[] {
  const groupId = order[groupIdField];

  if (!groupId) {
    return [];
  }

  return allOrders.filter((candidate) => candidate.id !== order.id && candidate[groupIdField] === groupId);
}

// "Juntar comanda" — orders linked to combine payment (and split bill) as one, at checkout.
export function getGroupedOrders(order: TOrderResponse, allOrders: TOrderResponse[]): TOrderResponse[] {
  return getOrdersSharingGroup(order, allOrders, "groupId");
}

// "Junto com" — orders linked only to show and print together for the kitchen; each keeps
// its own separate payment, unlike getGroupedOrders.
export function getKitchenGroupedOrders(order: TOrderResponse, allOrders: TOrderResponse[]): TOrderResponse[] {
  return getOrdersSharingGroup(order, allOrders, "kitchenGroupId");
}

// A category with a preset price (e.g. "Açaí 500ml" at R$15) adds that price to the order
// exactly once, no matter how many different products from that category end up in the
// cart or how many units of each — it represents a single base item (the açaí itself),
// with everything else in that category being toppings added on top of it.
function computeCategorySurcharge(items: TOrderItem[]): number {
  const seenCategoryIds = new Set<number>();
  let surcharge = 0;

  items.forEach((item) => {
    const category = item.product.category;

    if (category?.price && !seenCategoryIds.has(category.id)) {
      seenCategoryIds.add(category.id);
      surcharge += category.price;
    }
  });

  return surcharge;
}

export function computeOrderTotal(items: TOrderItem[], isTakeout?: boolean, takeoutFee = 0): number {
  const itemsTotal = items.reduce((total, item) => total + item.subtotal, 0) + computeCategorySurcharge(items);

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

// A split bill's payments (e.g. "Pessoa 1 pagou Pix, Pessoa 2 pagou Dinheiro") are computed
// against one combined total, but grouped ("Junto com") orders are still separate database
// rows, each needing its own payments that sum to its own total — otherwise its history/detail
// view would show payments that don't add up. This walks the payments in order, handing each
// order only as much as it needs and carrying the rest to the next one, splitting a payment
// in two whenever it straddles the boundary between two orders' totals (scaling a split CASH
// payment's amountReceived/changeDue down proportionally, since only a fraction of it is this
// order's share). Every method/amount is preserved exactly in aggregate across the result,
// which is all cash-reconciliation reports actually add up.
export function splitPaymentsAcrossOrders(payments: TOrderPayment[], orderTotals: number[]): TOrderPayment[][] {
  const remaining = payments.map((payment) => ({ ...payment }));
  let index = 0;

  return orderTotals.map((orderTotal) => {
    let amountLeft = orderTotal;
    const result: TOrderPayment[] = [];

    while (amountLeft > 0.005 && index < remaining.length) {
      const payment = remaining[index];
      const take = Math.min(payment.amount, amountLeft);
      const fraction = payment.amount > 0 ? take / payment.amount : 1;

      result.push({
        ...payment,
        amount: take,
        amountReceived: payment.amountReceived !== null ? payment.amountReceived * fraction : null,
        changeDue: payment.changeDue !== null ? payment.changeDue * fraction : null,
      });

      payment.amount -= take;
      amountLeft -= take;

      if (payment.amount <= 0.005) {
        index += 1;
      }
    }

    return result;
  });
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
      product: {
        id: product.id,
        name: product.name,
        category: { id: product.category.id, name: product.category.name, price: product.category.price },
      },
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
