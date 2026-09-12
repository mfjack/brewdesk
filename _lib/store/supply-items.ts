import type { TSupplyItem } from "@/app/order/interface";
import { readStore, updateStore, writeStore } from "./storage";

export interface TSupplyItemInput {
  name: string;
  brand?: string | null;
  quantity?: number;
  unit: string;
  minQuantity?: number;
  costPrice?: number;
  supplierId?: number | null;
  expiresAt?: string | null;
}

function buildSupplyItemFields(input: TSupplyItemInput): Omit<TSupplyItem, "id"> {
  return {
    name: input.name.trim(),
    brand: input.brand?.trim() || null,
    quantity: Number(input.quantity ?? 0),
    unit: input.unit,
    minQuantity: Number(input.minQuantity ?? 0),
    costPrice: Number(input.costPrice ?? 0),
    supplierId: input.supplierId ?? null,
    expiresAt: input.expiresAt || null,
  };
}

export function adjustSupplyItemStock(supplyItem: TSupplyItem, deltaInUnit: number) {
  supplyItem.quantity -= deltaInUnit;
}

export const supplyItemStore = {
  getSupplyItems: () => {
    return readStore().supplyItems;
  },

  createSupplyItem: (input: TSupplyItemInput) => {
    const data = readStore();

    const supplyItem: TSupplyItem = {
      id: data.nextIds.supplyItem++,
      ...buildSupplyItemFields(input),
    };

    data.supplyItems.push(supplyItem);

    writeStore(data);

    return supplyItem;
  },

  updateSupplyItem: (supplyItemId: number, input: TSupplyItemInput) => {
    const data = readStore();

    const supplyItem = data.supplyItems.find((item) => item.id === supplyItemId);

    if (!supplyItem) {
      throw new Error("Insumo não encontrado");
    }

    Object.assign(supplyItem, buildSupplyItemFields(input));

    writeStore(data);

    return supplyItem;
  },

  deleteSupplyItem: (supplyItemId: number) => {
    updateStore((data) => {
      data.supplyItems = data.supplyItems.filter((item) => item.id !== supplyItemId);
    });
  },
};
