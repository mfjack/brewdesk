import type { TCategory } from "@/app/(app)/order/interface";
import { supabase } from "@/_lib/supabase/client";
import { getEstablishmentId } from "@/_lib/supabase/establishment";
import { notifyStoreChange } from "@/_lib/store/notify-store-change";

export const categoryStore = {
  getCategories: async (): Promise<TCategory[]> => {
    const { data, error } = await supabase.from("categories").select("*").order("id");

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  createCategory: async (name: string, price: number | null = null): Promise<TCategory> => {
    const establishmentId = await getEstablishmentId();

    const { data, error } = await supabase
      .from("categories")
      .insert({ name: name.trim(), price, establishment_id: establishmentId })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["categories", "products"]);

    return data;
  },

  updateCategory: async (categoryId: number, name: string, price: number | null = null): Promise<TCategory> => {
    const { data, error } = await supabase
      .from("categories")
      .update({ name: name.trim(), price })
      .eq("id", categoryId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["categories", "products"]);

    return data;
  },

  deleteCategory: async (categoryId: number): Promise<void> => {
    const { error } = await supabase.from("categories").delete().eq("id", categoryId);

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["categories", "products"]);
  },
};
