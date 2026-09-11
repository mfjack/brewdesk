import type { TOrderResponse, TPaymentMethod, TProduct, TSupplyItem } from "@/app/order/interface";
import { computeOrderTotal, decrementOrRemoveItem, mergeOrderItem } from "@/app/order/order-math";
import { readStore, updateStore, writeStore } from "./storage";
import { adjustSupplyItemStock } from "./supply-items";

function consumeRecipeStock(product: TProduct, supplyItems: TSupplyItem[], quantitySold: number) {
  product.recipe.forEach((recipeItem) => {
    const supplyItem = supplyItems.find((item) => item.id === recipeItem.supplyItemId);

    if (supplyItem) {
      adjustSupplyItemStock(supplyItem, recipeItem.quantity * quantitySold);
    }
  });
}

export const orderStore = {
  getOrders: () => {
    return readStore().orders;
  },

  getOrder: (orderId: number) => {
    return readStore().orders.find((order) => order.id === orderId);
  },

  createOrder: (customerName: string, operatorName?: string | null) => {
    const data = readStore();

    const order: TOrderResponse = {
      id: data.nextIds.order++,

      customerName: customerName.trim(),

      status: "OPEN",

      createdAt: new Date().toISOString(),

      total: 0,

      orderItems: [],

      observation: null,

      printedItemQuantities: {},

      isTakeout: false,

      operatorName: operatorName?.trim() || null,

      paymentMethod: null,

      amountReceived: null,

      changeDue: null,
    };

    data.orders.push(order);

    writeStore(data);

    return order;
  },

  addOrderItem: (orderId: number, productId: number, quantity: number) => {
    const data = readStore();

    const order = data.orders.find((item) => item.id === orderId);

    const product = data.products.find((item) => item.id === productId);

    if (!order || !product) {
      throw new Error("Pedido ou produto não encontrado");
    }

    if (product.trackStock && product.quantity < quantity) {
      throw new Error(`Estoque insuficiente para "${product.name}".`);
    }

    order.orderItems = mergeOrderItem(order.orderItems, product, quantity, () => data.nextIds.item++);

    order.total = computeOrderTotal(order.orderItems);

    if (product.trackStock) {
      product.quantity -= quantity;
    }

    consumeRecipeStock(product, data.supplyItems, quantity);

    writeStore(data);

    return order;
  },

  removeOrderItem: (orderId: number, itemId: number) => {
    const data = readStore();

    const order = data.orders.find((item) => item.id === orderId);

    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    const removedItem = order.orderItems.find((item) => item.id === itemId);

    order.orderItems = decrementOrRemoveItem(order.orderItems, itemId);

    order.total = computeOrderTotal(order.orderItems);

    if (removedItem) {
      const product = data.products.find((item) => item.id === removedItem.product.id);

      if (product?.trackStock) {
        product.quantity += 1;
      }

      if (product) {
        consumeRecipeStock(product, data.supplyItems, -1);
      }
    }

    if (order.printedItemQuantities) {
      const printed = order.printedItemQuantities[itemId] ?? 0;

      const updatedItem = order.orderItems.find((i) => i.id === itemId);

      if (updatedItem) {
        order.printedItemQuantities[itemId] = Math.min(printed, updatedItem.quantity);
      } else {
        delete order.printedItemQuantities[itemId];
      }
    }

    writeStore(data);

    return order;
  },

  updateOrderStatus: (
    orderId: number,

    status: "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "PAID",

    observation?: string,

    customerName?: string,

    isTakeout?: boolean,

    payment?: {
      paymentMethod?: TPaymentMethod;
      amountReceived?: number | null;
    },
  ) => {
    const data = readStore();

    const order = data.orders.find((item) => item.id === orderId);

    if (!order) {
      throw new Error("Comanda não encontrada.");
    }

    order.status = status;

    if (observation !== undefined) {
      order.observation = observation || null;
    }

    if (customerName !== undefined) {
      order.customerName = customerName.trim();
    }

    if (isTakeout !== undefined) {
      order.isTakeout = isTakeout;
    }

    if (payment) {
      order.paymentMethod = payment.paymentMethod ?? null;
      order.amountReceived = payment.paymentMethod === "CASH" ? payment.amountReceived ?? null : null;
      order.changeDue =
        payment.paymentMethod === "CASH" && payment.amountReceived != null
          ? Math.max(payment.amountReceived - order.total, 0)
          : null;
    }

    writeStore(data);

    return order;
  },

  markOrderItemsPrinted: (orderId: number, printedItemQuantities: Record<number, number>) => {
    const data = readStore();

    const order = data.orders.find((item) => item.id === orderId);

    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    order.printedItemQuantities = {
      ...printedItemQuantities,
    };

    writeStore(data);

    return order;
  },

  deleteOrder: (orderId: number) => {
    updateStore((data) => {
      const order = data.orders.find((item) => item.id === orderId);

      if (order) {
        order.orderItems.forEach((item) => {
          const product = data.products.find((p) => p.id === item.product.id);

          if (product?.trackStock) {
            product.quantity += item.quantity;
          }

          if (product) {
            consumeRecipeStock(product, data.supplyItems, -item.quantity);
          }
        });
      }

      data.orders = data.orders.filter((item) => item.id !== orderId);
    });
  },
};
