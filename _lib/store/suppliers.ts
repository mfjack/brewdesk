import type { TSupplier } from "@/app/(app)/order/interface";
import { supabase } from "@/_lib/supabase/client";
import { getEstablishmentId } from "@/_lib/supabase/establishment";
import { notifyStoreChange } from "@/_lib/store/notify-store-change";

export type TSupplierInput = Partial<Omit<TSupplier, "id" | "companyName">> & Pick<TSupplier, "companyName">;

function fromRow(row: {
  id: number;
  company_name: string;
  whatsapp: string | null;
  supplies_description: string | null;
  purchase_link: string | null;
  delivery_days: TSupplier["deliveryDays"];
  delivery_period: TSupplier["deliveryPeriod"];
  observation: string | null;
}): TSupplier {
  return {
    id: row.id,
    companyName: row.company_name,
    whatsapp: row.whatsapp,
    suppliesDescription: row.supplies_description,
    purchaseLink: row.purchase_link,
    deliveryDays: row.delivery_days,
    deliveryPeriod: row.delivery_period,
    observation: row.observation,
  };
}

function toRow(input: TSupplierInput) {
  return {
    company_name: input.companyName.trim(),
    whatsapp: input.whatsapp?.trim() || null,
    supplies_description: input.suppliesDescription?.trim() || null,
    purchase_link: input.purchaseLink?.trim() || null,
    delivery_days: input.deliveryDays ?? [],
    delivery_period: input.deliveryPeriod || null,
    observation: input.observation?.trim() || null,
  };
}

export const supplierStore = {
  getSuppliers: async (): Promise<TSupplier[]> => {
    const { data, error } = await supabase.from("suppliers").select("*").order("id");

    if (error) {
      throw new Error(error.message);
    }

    return data.map(fromRow);
  },

  createSupplier: async (input: TSupplierInput): Promise<TSupplier> => {
    const establishmentId = await getEstablishmentId();

    const { data, error } = await supabase
      .from("suppliers")
      .insert({ ...toRow(input), establishment_id: establishmentId })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["suppliers"]);

    return fromRow(data);
  },

  updateSupplier: async (supplierId: number, input: TSupplierInput): Promise<TSupplier> => {
    const { data, error } = await supabase.from("suppliers").update(toRow(input)).eq("id", supplierId).select().single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["suppliers"]);

    return fromRow(data);
  },

  deleteSupplier: async (supplierId: number): Promise<void> => {
    const { error } = await supabase.from("suppliers").delete().eq("id", supplierId);

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["suppliers"]);
  },
};
