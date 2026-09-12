import type { TSupplyItem } from "@/app/order/interface";
import { readStore, updateStore, writeStore } from "./storage";
import { roundToAvoidFloatDrift } from "@/_lib/supply-units";

export type TSupplyItemInput = Partial<Omit<TSupplyItem, "id" | "initialQuantity" | "name" | "unit">> &
  Pick<TSupplyItem, "name" | "unit">;

function buildSupplyItemFields(input: TSupplyItemInput): Omit<TSupplyItem, "id" | "initialQuantity"> {
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
  supplyItem.quantity = roundToAvoidFloatDrift(supplyItem.quantity - deltaInUnit);
}

export const supplyItemStore = {
  getSupplyItems: () => {
    return readStore().supplyItems;
  },

  createSupplyItem: (input: TSupplyItemInput) => {
    const data = readStore();

    const fields = buildSupplyItemFields(input);

    const supplyItem: TSupplyItem = {
      id: data.nextIds.supplyItem++,
      ...fields,
      initialQuantity: fields.quantity,
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
