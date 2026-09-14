import type { TCategory, TOperator, TOrderResponse, TProduct, TStoreSettings, TSupplier, TSupplyItem } from "@/app/order/interface";
import { isOrderPaid } from "@/app/order/order-math";
import { APP_PAGES } from "@/_lib/app-pages";

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
  featureFlags: {
    takeout: true,
    orderGrouping: true,
    splitBill: true,
  },
  takeoutFee: 2,
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

export function hasAnyOperatorWithSettingsAccess(data: StoreData): boolean {
  return data.settings.operators.some((operator) => operator.allowedRoutes.includes("/settings"));
}

function normalizeOrders(orders: TOrderResponse[]): { orders: TOrderResponse[]; migrated: boolean } {
  let migrated = false;

  const normalized = orders.map((order) => {
    const legacy = order as TOrderResponse & {
      paymentMethod?: TOrderResponse["payments"][number]["method"] | null;
      amountReceived?: number | null;
      changeDue?: number | null;
    };

    let payments = order.payments;

    if (!payments) {
      migrated = true;

      payments = legacy.paymentMethod
        ? [
            {
              method: legacy.paymentMethod,
              amount: order.total,
              amountReceived: legacy.amountReceived ?? order.total,
              changeDue: legacy.changeDue ?? 0,
            },
          ]
        : [];
    }

    return {
      ...order,
      orderItems: order.orderItems.map((item) => ({ ...item, costPrice: item.costPrice ?? 0 })),
      groupId: order.groupId ?? null,
      payments,
    };
  });

  return { orders: normalized, migrated };
}

function normalizeProducts(products: TProduct[]): TProduct[] {
  return products.map((product) => ({ ...product, recipe: product.recipe ?? [] }));
}

const LEGACY_ENUM_ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  ATENDENTE: ["/", "/order-detail"],
  ADM: ["/", "/order-detail", "/category", "/product", "/stock"],
  GERENTE: APP_PAGES.map((page) => page.path),
};

interface TLegacyRole {
  id: number;
  allowedRoutes: string[];
}

function normalizeOperatorAccess(data: StoreData, legacyRoles: TLegacyRole[]): boolean {
  let migrated = false;

  data.settings.operators = data.settings.operators.map((operator) => {
    if (Array.isArray(operator.allowedRoutes)) {
      return operator;
    }

    migrated = true;

    const legacy = operator as TOperator & { role?: string; roleId?: number; roleIds?: number[] };

    let allowedRoutes: string[] = [];

    if (Array.isArray(legacy.roleIds)) {
      const routes = new Set<string>();

      legacy.roleIds.forEach((roleId) => {
        legacyRoles.find((role) => role.id === roleId)?.allowedRoutes.forEach((route) => routes.add(route));
      });

      allowedRoutes = Array.from(routes);
    } else if (typeof legacy.roleId === "number") {
      allowedRoutes = legacyRoles.find((role) => role.id === legacy.roleId)?.allowedRoutes ?? [];
    } else if (legacy.role) {
      allowedRoutes = LEGACY_ENUM_ROLE_ALLOWED_ROUTES[legacy.role] ?? [];
    }

    if (allowedRoutes.length === 0) {
      allowedRoutes = APP_PAGES.map((page) => page.path);
    }

    return { id: operator.id, name: operator.name, pin: operator.pin, allowedRoutes };
  });

  return migrated;
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
    const parsed = JSON.parse(stored) as Partial<StoreData> & { roles?: TLegacyRole[] };
    const legacyRoles = parsed.roles ?? [];

    const data: StoreData = {
      ...clone(initialData),
      ...parsed,
      settings: { ...defaultSettings, ...parsed.settings },
      nextIds: { ...clone(initialData.nextIds), ...parsed.nextIds },
    };

    delete (data as Partial<StoreData> & { roles?: TLegacyRole[] }).roles;
    delete (data.nextIds as { role?: number }).role;

    const { orders: normalizedOrders, migrated: ordersMigrated } = normalizeOrders(data.orders);

    data.orders = normalizedOrders;
    data.products = normalizeProducts(data.products);

    const operatorsMigrated = normalizeOperatorAccess(data, legacyRoles);

    const supplyItemsMigrated = normalizeSupplyItems(data);
    const ordersPruned = pruneOldPaidOrders(data);

    if (ordersPruned || supplyItemsMigrated || operatorsMigrated || ordersMigrated) {
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
