import type { TRecipeItem, TSupplyItem } from "@/app/(app)/order/interface";
import { supabase } from "@/_lib/supabase/client";
import { getEstablishmentId } from "@/_lib/supabase/establishment";
import { roundToAvoidFloatDrift } from "@/_lib/supply-units";
import { notifyStoreChange } from "@/_lib/store/notify-store-change";
import { getRecipeCost } from "@/_lib/recipe-cost";
import { mapSupplyItemRow } from "@/_lib/store/shared";

export type TSupplyItemInput = Partial<Omit<TSupplyItem, "id" | "initialQuantity" | "name" | "unit">> &
  Pick<TSupplyItem, "name" | "unit">;

function toRow(input: TSupplyItemInput) {
  return {
    name: input.name.trim(),
    brand: input.brand?.trim() || null,
    quantity: Number(input.quantity ?? 0),
    unit: input.unit,
    min_quantity: Number(input.minQuantity ?? 0),
    cost_price: Number(input.costPrice ?? 0),
    supplier_id: input.supplierId ?? null,
    expires_at: input.expiresAt || null,
  };
}

export function adjustSupplyItemStock(supplyItem: TSupplyItem, deltaInUnit: number) {
  supplyItem.quantity = roundToAvoidFloatDrift(supplyItem.quantity - deltaInUnit);
}

async function recalculateProductCostsForSupplyItem(supplyItemId: number): Promise<void> {
  // .contains() serializes an array of objects incorrectly for a jsonb column (sends
  // "[object Object]" instead of JSON) — passing the JSON string straight to .filter()
  // with the "cs" (contains) operator avoids that.
  const { data: productRows, error: productsError } = await supabase
    .from("products")
    .select("id, recipe")
    .filter("recipe", "cs", JSON.stringify([{ supplyItemId }]));

  if (productsError) {
    throw new Error(productsError.message);
  }

  const affectedProducts = productRows;

  if (affectedProducts.length === 0) {
    return;
  }

  const referencedSupplyItemIds = [
    ...new Set(affectedProducts.flatMap((product) => (product.recipe as TRecipeItem[]).map((item) => item.supplyItemId))),
  ];

  const { data: supplyItemRows, error: supplyItemsError } = await supabase
    .from("supply_items")
    .select("*")
    .in("id", referencedSupplyItemIds);

  if (supplyItemsError) {
    throw new Error(supplyItemsError.message);
  }

  const allSupplyItems = supplyItemRows.map(mapSupplyItemRow);

  await Promise.all(
    affectedProducts.map((product) =>
      supabase
        .from("products")
        .update({ cost_price: getRecipeCost(product.recipe as TRecipeItem[], allSupplyItems) })
        .eq("id", product.id),
    ),
  );

  notifyStoreChange(["products"]);
}

export const supplyItemStore = {
  getSupplyItems: async (): Promise<TSupplyItem[]> => {
    const { data, error } = await supabase.from("supply_items").select("*").order("id");

    if (error) {
      throw new Error(error.message);
    }

    return data.map(mapSupplyItemRow);
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

    return mapSupplyItemRow(data);
  },

  updateSupplyItem: async (supplyItemId: number, input: TSupplyItemInput): Promise<TSupplyItem> => {
    const row = toRow(input);

    // initial_quantity always tracks the quantity entered here — editing the stock form
    // is how you (re)register a supply item's count, and getSupplyUnitCost uses it as the
    // cost basis for that registration.
    const { data, error } = await supabase
      .from("supply_items")
      .update({ ...row, initial_quantity: row.quantity })
      .eq("id", supplyItemId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["supplyItems"]);

    await recalculateProductCostsForSupplyItem(supplyItemId);

    return mapSupplyItemRow(data);
  },

  deleteSupplyItem: async (supplyItemId: number): Promise<void> => {
    const { error } = await supabase.from("supply_items").delete().eq("id", supplyItemId);

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["supplyItems"]);
  },
};
