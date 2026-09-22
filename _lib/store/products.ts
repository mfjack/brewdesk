import type { TProduct } from "@/app/(app)/order/interface";
import { supabase } from "@/_lib/supabase/client";
import { getEstablishmentId } from "@/_lib/supabase/establishment";
import { notifyStoreChange } from "@/_lib/store/notify-store-change";
import { mapProductRow, type TProductRow } from "@/_lib/store/shared";

export type TProductInput = Partial<Omit<TProduct, "id" | "category" | "name" | "price">> &
  Pick<TProduct, "name" | "price" | "category">;

function toRow(input: TProductInput) {
  const trackStock = input.trackStock ?? true;

  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    photo_url: input.photoUrl || null,
    price: Number(input.price),
    cost_price: Number(input.costPrice ?? 0),
    quantity: trackStock ? Number(input.quantity ?? 0) : 0,
    track_stock: trackStock,
    low_stock_threshold: trackStock ? Number(input.lowStockThreshold ?? 5) : 0,
    category_id: input.category.id,
    recipe: input.recipe ?? [],
  };
}

const SELECT_WITH_CATEGORY = "*, category:categories(id, name)";

export const productStore = {
  getProducts: async (): Promise<TProduct[]> => {
    const { data, error } = await supabase.from("products").select(SELECT_WITH_CATEGORY).order("id");

    if (error) {
      throw new Error(error.message);
    }

    return (data as unknown as TProductRow[]).map(mapProductRow);
  },

  createProduct: async (input: TProductInput): Promise<TProduct> => {
    const establishmentId = await getEstablishmentId();

    const { data, error } = await supabase
      .from("products")
      .insert({ ...toRow(input), establishment_id: establishmentId })
      .select(SELECT_WITH_CATEGORY)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["products"]);

    return mapProductRow(data as unknown as TProductRow);
  },

  updateProduct: async (productId: number, input: TProductInput): Promise<TProduct> => {
    const { data, error } = await supabase
      .from("products")
      .update(toRow(input))
      .eq("id", productId)
      .select(SELECT_WITH_CATEGORY)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["products"]);

    return mapProductRow(data as unknown as TProductRow);
  },

  deleteProduct: async (productId: number): Promise<void> => {
    const { error } = await supabase.from("products").delete().eq("id", productId);

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["products"]);
  },
};
