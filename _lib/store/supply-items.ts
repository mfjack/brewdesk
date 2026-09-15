import type { TSupplyItem } from "@/app/(app)/order/interface";
import { supabase } from "@/_lib/supabase/client";
import { getEstablishmentId } from "@/_lib/supabase/establishment";
import { convertQuantity, roundToAvoidFloatDrift } from "@/_lib/supply-units";
import { notifyStoreChange } from "@/_lib/store/notify-store-change";

export type TSupplyItemInput = Partial<Omit<TSupplyItem, "id" | "initialQuantity" | "name" | "unit">> &
  Pick<TSupplyItem, "name" | "unit">;

function fromRow(row: {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  initial_quantity: number;
  unit: TSupplyItem["unit"];
  min_quantity: number;
  min_quantity_unit: TSupplyItem["minQuantityUnit"];
  cost_price: number;
  supplier_id: number | null;
  expires_at: string | null;
}): TSupplyItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    quantity: Number(row.quantity),
    initialQuantity: Number(row.initial_quantity),
    unit: row.unit,
    minQuantity: Number(row.min_quantity),
    minQuantityUnit: row.min_quantity_unit,
    costPrice: Number(row.cost_price),
    supplierId: row.supplier_id,
    expiresAt: row.expires_at,
  };
}

function toRow(input: TSupplyItemInput) {
  return {
    name: input.name.trim(),
    brand: input.brand?.trim() || null,
    quantity: Number(input.quantity ?? 0),
    unit: input.unit,
    min_quantity: Number(input.minQuantity ?? 0),
    min_quantity_unit: input.minQuantityUnit ?? input.unit,
    cost_price: Number(input.costPrice ?? 0),
    supplier_id: input.supplierId ?? null,
    expires_at: input.expiresAt || null,
  };
}

export function adjustSupplyItemStock(supplyItem: TSupplyItem, deltaInUnit: number) {
  supplyItem.quantity = roundToAvoidFloatDrift(supplyItem.quantity - deltaInUnit);
}

export const supplyItemStore = {
  getSupplyItems: async (): Promise<TSupplyItem[]> => {
    const { data, error } = await supabase.from("supply_items").select("*").order("id");

    if (error) {
      throw new Error(error.message);
    }

    return data.map(fromRow);
  },

  createSupplyItem: async (input: TSupplyItemInput): Promise<TSupplyItem> => {
    const row = toRow(input);
    const establishmentId = await getEstablishmentId();

    const { data, error } = await supabase
      .from("supply_items")
      .insert({ ...row, initial_quantity: row.quantity, establishment_id: establishmentId })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["supplyItems"]);

    return fromRow(data);
  },

  updateSupplyItem: async (supplyItemId: number, input: TSupplyItemInput): Promise<TSupplyItem> => {
    const { data: existing, error: fetchError } = await supabase
      .from("supply_items")
      .select("unit, initial_quantity")
      .eq("id", supplyItemId)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const row = toRow(input);
    const initialQuantity =
      existing.unit === row.unit ? existing.initial_quantity : convertQuantity(Number(existing.initial_quantity), existing.unit, row.unit);

    const { data, error } = await supabase
      .from("supply_items")
      .update({ ...row, initial_quantity: initialQuantity })
      .eq("id", supplyItemId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["supplyItems"]);

    return fromRow(data);
  },

  deleteSupplyItem: async (supplyItemId: number): Promise<void> => {
    const { error } = await supabase.from("supply_items").delete().eq("id", supplyItemId);

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["supplyItems"]);
  },
};
