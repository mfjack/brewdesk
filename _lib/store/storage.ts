import type { TCategory, TOrderResponse, TProduct, TStoreSettings } from "@/app/order/interface";

export const STORAGE_KEY = "brewdesk.data.v1";

export interface StoreData {
  categories: TCategory[];
  products: TProduct[];
  orders: TOrderResponse[];
  settings: TStoreSettings;
  nextIds: {
    category: number;
    product: number;
    order: number;
    item: number;
    operator: number;
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

  nextIds: {
    category: 1,
    product: 1,
    order: 1,
    item: 1,
    operator: 1,
  },
};

export function clone<T>(value: T): T {
  return structuredClone(value);
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

    return {
      ...clone(initialData),
      ...parsed,
      settings: { ...defaultSettings, ...parsed.settings },
      nextIds: { ...clone(initialData.nextIds), ...parsed.nextIds },
    };
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
