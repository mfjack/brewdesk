import type { TCategory, TOrderResponse, TProduct, TStoreSettings, TSupplier, TSupplyItem } from "@/app/order/interface";
import { isOrderPaid } from "@/app/order/order-math";

export const STORAGE_KEY = "brewdesk.data.v1";

export interface StoreData {
  categories: TCategory[];
  products: TProduct[];
  orders: TOrderResponse[];
  settings: TStoreSettings;
  suppliers: TSupplier[];
  supplyItems: TSupplyItem[];
  nextIds: {
    category: number;
    product: number;
    order: number;
    item: number;
    operator: number;
    supplier: number;
    supplyItem: number;
  };
}

export const defaultSettings: TStoreSettings = {
  name: "Mañana Café y Coisinhas",
  cnpj: "64.490.426/0001-53",
  address: "Avenida José Passos de Souza Junior, 3655\nPraia do Pecado - Macaé/RJ",
  phone: null,
  logoUrl: null,
  receiptFooterMessage: null,
  operators: [],
  pixQrCodeUrl: null,
};

export const initialData: StoreData = {
  categories: [],

  products: [],

  orders: [],

  settings: defaultSettings,

  suppliers: [],

  supplyItems: [],

  nextIds: {
    category: 1,
    product: 1,
    order: 1,
    item: 1,
    operator: 1,
    supplier: 1,
    supplyItem: 1,
  },
};

export function clone<T>(value: T): T {
  return structuredClone(value);
}

function normalizeOrders(orders: TOrderResponse[]): TOrderResponse[] {
  return orders.map((order) => ({
    ...order,
    orderItems: order.orderItems.map((item) => ({ ...item, costPrice: item.costPrice ?? 0 })),
  }));
}

function normalizeProducts(products: TProduct[]): TProduct[] {
  return products.map((product) => ({ ...product, recipe: product.recipe ?? [] }));
}

function normalizeSupplyItems(data: StoreData): boolean {
  let migrated = false;

  data.supplyItems = data.supplyItems.map((item) => {
    let normalizedItem = item;

    const legacyUnitContent = (item as TSupplyItem & { unitContent?: number | null }).unitContent;

    if (legacyUnitContent && legacyUnitContent > 0) {
      migrated = true;

      const migratedItem: Record<string, unknown> = { ...normalizedItem, quantity: normalizedItem.quantity * legacyUnitContent };

      delete migratedItem.unitContent;

      normalizedItem = migratedItem as unknown as TSupplyItem;
    }

    if (normalizedItem.initialQuantity === undefined) {
      migrated = true;

      normalizedItem = { ...normalizedItem, initialQuantity: normalizedItem.quantity };
    }

    return normalizedItem;
  });

  return migrated;
}

const PAID_ORDER_RETENTION_DAYS = 60;

function pruneOldPaidOrders(data: StoreData): boolean {
  const cutoff = Date.now() - PAID_ORDER_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const originalCount = data.orders.length;

  data.orders = data.orders.filter((order) => !isOrderPaid(order) || new Date(order.createdAt).getTime() >= cutoff);

  return data.orders.length !== originalCount;
}

export function readStore(): StoreData {
  if (typeof window === "undefined") {
    return clone(initialData);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    writeStore(initialData);
    return clone(initialData);
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StoreData>;

    const data: StoreData = {
      ...clone(initialData),
      ...parsed,
      settings: { ...defaultSettings, ...parsed.settings },
      nextIds: { ...clone(initialData.nextIds), ...parsed.nextIds },
    };

    data.orders = normalizeOrders(data.orders);
    data.products = normalizeProducts(data.products);

    const supplyItemsMigrated = normalizeSupplyItems(data);
    const ordersPruned = pruneOldPaidOrders(data);

    if (ordersPruned || supplyItemsMigrated) {
      writeStore(data);
    }

    return data;
  } catch {
    writeStore(initialData);
    return clone(initialData);
  }
}

export function writeStore(data: StoreData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  window.dispatchEvent(new Event("brewdesk-store-change"));
}

export function updateStore(update: (data: StoreData) => void) {
  const data = readStore();

  update(data);

  writeStore(data);
}
