import type { TCategory, TOrderResponse, TProduct } from "@/app/order/interface";
import { computeOrderTotal, decrementOrRemoveItem, mergeOrderItem } from "@/app/order/order-math";

const STORAGE_KEY = "brewdesk.data.v1";

interface StoreData {
  categories: TCategory[];
  products: TProduct[];
  orders: TOrderResponse[];
  nextIds: {
    category: number;
    product: number;
    order: number;
    item: number;
  };
}

const initialData: StoreData = {
  categories: [],

  products: [],

  orders: [],

  nextIds: {
    category: 1,
    product: 1,
    order: 1,
    item: 1,
  },
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function readStore(): StoreData {
  if (typeof window === "undefined") {
    return clone(initialData);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    writeStore(initialData);
    return clone(initialData);
  }

  try {
    return JSON.parse(stored) as StoreData;
  } catch {
    writeStore(initialData);
    return clone(initialData);
  }
}

function writeStore(data: StoreData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  window.dispatchEvent(new Event("brewdesk-store-change"));
}

function updateStore(update: (data: StoreData) => void) {
  const data = readStore();

  update(data);

  writeStore(data);
}

interface TProductInput {
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  price: number;
  quantity?: number;
  trackStock?: boolean;
  categoryId: number;
}

function buildProductFields(input: TProductInput, category: TCategory): Omit<TProduct, "id"> {
  const trackStock = input.trackStock ?? true;

  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    photoUrl: input.photoUrl || null,
    price: Number(input.price),
    quantity: trackStock ? Number(input.quantity ?? 0) : 0,
    trackStock,
    category,
  };
}

export const localStore = {
  getCategories: () => {
    return readStore().categories;
  },

  getProducts: () => {
    return readStore().products;
  },

  getOrders: () => {
    return readStore().orders;
  },

  getOrder: (orderId: number) => {
    return readStore().orders.find((order) => order.id === orderId);
  },

  createCategory: (name: string) => {
    const category = {
      id: 0,
      name: name.trim(),
    };

    updateStore((data) => {
      category.id = data.nextIds.category++;

      data.categories.push(category);
    });

    return category;
  },

  deleteCategory: (categoryId: number) => {
    updateStore((data) => {
      data.categories = data.categories.filter((category) => category.id !== categoryId);

      data.products = data.products.filter((product) => product.category.id !== categoryId);
    });
  },

  createProduct: (input: TProductInput) => {
    const data = readStore();

    const category = data.categories.find((item) => item.id === input.categoryId);

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    const product: TProduct = {
      id: data.nextIds.product++,
      ...buildProductFields(input, category),
    };

    data.products.push(product);

    writeStore(data);

    return product;
  },

  updateProduct: (productId: number, input: TProductInput) => {
    const data = readStore();

    const product = data.products.find((item) => item.id === productId);

    if (!product) {
      throw new Error("Produto não encontrado");
    }

    const category = data.categories.find((item) => item.id === input.categoryId);

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    Object.assign(product, buildProductFields(input, category));

    writeStore(data);

    return product;
  },

  deleteProduct: (productId: number) => {
    updateStore((data) => {
      data.products = data.products.filter((product) => product.id !== productId);
    });
  },

  createOrder: (customerName: string) => {
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
        });
      }

      data.orders = data.orders.filter((item) => item.id !== orderId);
    });
  },
};
