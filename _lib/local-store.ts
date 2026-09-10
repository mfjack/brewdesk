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
  categories: [
    { id: 1, name: "Cafés" },
    { id: 2, name: "Bebidas" },
    { id: 3, name: "Comidas" },
  ],

  products: [
    {
      id: 1,
      name: "Espresso",
      price: 6,
      category: { id: 1, name: "Cafés" },
    },
    {
      id: 2,
      name: "Latte",
      price: 10,
      category: { id: 1, name: "Cafés" },
    },
    {
      id: 3,
      name: "Mocha",
      price: 12,
      category: { id: 1, name: "Cafés" },
    },
    {
      id: 4,
      name: "Chá gelado",
      price: 8,
      category: { id: 2, name: "Bebidas" },
    },
    {
      id: 5,
      name: "Bolo do dia",
      price: 9,
      category: { id: 3, name: "Comidas" },
    },
  ],

  orders: [],

  nextIds: {
    category: 4,
    product: 6,
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

export const localStore = {
  /**
   * CATEGORIAS
   */
  getCategories: () => {
    return readStore().categories;
  },

  /**
   * PRODUTOS
   */
  getProducts: () => {
    return readStore().products;
  },

  /**
   * COMANDAS
   */
  getOrders: () => {
    return readStore().orders;
  },

  getOrder: (orderId: number) => {
    return readStore().orders.find((order) => order.id === orderId);
  },

  /**
   * CRIAR CATEGORIA
   */
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

  /**
   * EXCLUIR CATEGORIA
   */
  deleteCategory: (categoryId: number) => {
    updateStore((data) => {
      data.categories = data.categories.filter((category) => category.id !== categoryId);

      data.products = data.products.filter((product) => product.category.id !== categoryId);
    });
  },

  /**
   * CRIAR PRODUTO
   */
  createProduct: (input: { name: string; price: number; categoryId: number }) => {
    const data = readStore();

    const category = data.categories.find((item) => item.id === input.categoryId);

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    const product: TProduct = {
      id: data.nextIds.product++,
      name: input.name.trim(),
      price: Number(input.price),
      category,
    };

    data.products.push(product);

    writeStore(data);

    return product;
  },

  /**
   * EXCLUIR PRODUTO
   */
  deleteProduct: (productId: number) => {
    updateStore((data) => {
      data.products = data.products.filter((product) => product.id !== productId);
    });
  },

  /**
   * CRIAR COMANDA
   */
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
    };

    data.orders.push(order);

    writeStore(data);

    return order;
  },

  /**
   * ADICIONAR ITEM À COMANDA
   */
  addOrderItem: (orderId: number, productId: number, quantity: number) => {
    const data = readStore();

    const order = data.orders.find((item) => item.id === orderId);

    const product = data.products.find((item) => item.id === productId);

    if (!order || !product) {
      throw new Error("Pedido ou produto não encontrado");
    }

    order.orderItems = mergeOrderItem(order.orderItems, product, quantity, () => data.nextIds.item++);

    order.total = computeOrderTotal(order.orderItems);

    writeStore(data);

    return order;
  },

  /**
   * REMOVER ITEM DA COMANDA
   */
  removeOrderItem: (orderId: number, itemId: number) => {
    const data = readStore();

    const order = data.orders.find((item) => item.id === orderId);

    if (!order) {
      throw new Error("Pedido não encontrado");
    }

    order.orderItems = decrementOrRemoveItem(order.orderItems, itemId);

    order.total = computeOrderTotal(order.orderItems);

    /**
     * Corrige a quantidade impressa.
     */
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

  /**
   * ATUALIZAR STATUS DA COMANDA
   *
   * PAID significa que a comanda foi paga.
   *
   * IMPORTANTE:
   * A comanda NÃO é excluída.
   *
   * Ela permanece em:
   *
   * data.orders
   *
   * para posteriormente ser utilizada
   * no Relatório de Vendas.
   */
  updateOrderStatus: (
    orderId: number,

    status: "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "PAID",

    observation?: string,

    customerName?: string,
  ) => {
    const data = readStore();

    const order = data.orders.find((item) => item.id === orderId);

    if (!order) {
      throw new Error("Comanda não encontrada.");
    }

    /**
     * Atualiza o status.
     */
    order.status = status;

    /**
     * Atualiza observação somente
     * quando ela foi informada.
     */
    if (observation !== undefined) {
      order.observation = observation || null;
    }

    /**
     * Atualiza nome do cliente somente
     * quando foi informado.
     */
    if (customerName !== undefined) {
      order.customerName = customerName.trim();
    }

    /**
     * Salva a comanda.
     *
     * Mesmo quando status = PAID,
     * ela continua dentro de data.orders.
     */
    writeStore(data);

    return order;
  },

  /**
   * MARCAR ITENS COMO IMPRESSOS
   */
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

  /**
   * EXCLUIR COMANDA
   *
   * Esta função continua existindo
   * para uma eventual exclusão manual.
   *
   * O pagamento NÃO utiliza esta função.
   */
  deleteOrder: (orderId: number) => {
    updateStore((data) => {
      data.orders = data.orders.filter((order) => order.id !== orderId);
    });
  },
};
