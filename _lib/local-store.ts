import type { TCategory, TOrderResponse, TProduct } from "@/app/order/interface";

const STORAGE_KEY = "brewdesk.data.v1";

interface StoreData {
  categories: TCategory[];
  products: TProduct[];
  orders: TOrderResponse[];
  nextIds: { category: number; product: number; order: number; item: number };
}

const initialData: StoreData = {
  categories: [
    { id: 1, name: "Cafés" },
    { id: 2, name: "Bebidas" },
    { id: 3, name: "Comidas" },
  ],
  products: [
    { id: 1, name: "Espresso", price: 6, category: { id: 1, name: "Cafés" } },
    { id: 2, name: "Latte", price: 10, category: { id: 1, name: "Cafés" } },
    { id: 3, name: "Mocha", price: 12, category: { id: 1, name: "Cafés" } },
    { id: 4, name: "Chá gelado", price: 8, category: { id: 2, name: "Bebidas" } },
    { id: 5, name: "Bolo do dia", price: 9, category: { id: 3, name: "Comidas" } },
  ],
  orders: [],
  nextIds: { category: 4, product: 6, order: 1, item: 1 },
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function readStore(): StoreData {
  if (typeof window === "undefined") return clone(initialData);

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

export const localStore = {
  getCategories: () => readStore().categories,
  getProducts: () => readStore().products,
  getOrders: () => readStore().orders,
  getOrder: (orderId: number) => readStore().orders.find((order) => order.id === orderId),

  createCategory: (name: string) => {
    const category = { id: 0, name: name.trim() };
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

  createProduct: (input: { name: string; price: number; categoryId: number }) => {
    const data = readStore();
    const category = data.categories.find((item) => item.id === input.categoryId);
    if (!category) throw new Error("Categoria não encontrada");

    const product: TProduct = { id: data.nextIds.product++, name: input.name.trim(), price: Number(input.price), category };
    data.products.push(product);
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
      customerName,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      total: 0,
      orderItems: [],
      observation: null,
    };
    data.orders.push(order);
    writeStore(data);
    return order;
  },

  addOrderItem: (orderId: number, productId: number, quantity: number, observation?: string) => {
    const data = readStore();
    const order = data.orders.find((item) => item.id === orderId);
    const product = data.products.find((item) => item.id === productId);
    if (!order || !product) throw new Error("Pedido ou produto não encontrado");

    const existingItem = order.orderItems.find((item) => item.product.id === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.quantity * existingItem.unitPrice;
    } else {
      order.orderItems.push({
        id: data.nextIds.item++,
        product,
        quantity,
        unitPrice: product.price,
        subtotal: product.price * quantity,
        observation: observation ?? null,
      });
    }
    order.total = order.orderItems.reduce((total, item) => total + item.subtotal, 0);
    writeStore(data);
    return order;
  },

  removeOrderItem: (orderId: number, itemId: number) => {
    const data = readStore();
    const order = data.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("Pedido não encontrado");

    const item = order.orderItems.find((item) => item.id === itemId);
    if (item) {
      if (item.quantity > 1) {
        item.quantity -= 1;
        item.subtotal = item.quantity * item.unitPrice;
      } else {
        order.orderItems = order.orderItems.filter((i) => i.id !== itemId);
      }
    }

    order.total = order.orderItems.reduce((total, item) => total + item.subtotal, 0);
    writeStore(data);
    return order;
  },

  updateOrderStatus: (orderId: number, status: TOrderResponse["status"], observation?: string) => {
    const data = readStore();
    const order = data.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("Pedido não encontrado");
    order.status = status;
    if (observation !== undefined) order.observation = observation || null;
    writeStore(data);
    return order;
  },

  deleteOrder: (orderId: number) => {
    updateStore((data) => {
      data.orders = data.orders.filter((order) => order.id !== orderId);
    });
  },
};
