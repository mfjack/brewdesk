import type { TOperator, TStoreSettings } from "@/app/(app)/order/interface";
import { supabase } from "@/_lib/supabase/client";
import { getEstablishmentId } from "@/_lib/supabase/establishment";
import { notifyStoreChange } from "@/_lib/store/notify-store-change";

export const defaultFeatureFlags: TStoreSettings["featureFlags"] = {
  takeout: true,
  orderGrouping: true,
  splitBill: true,
  creditSale: false,
  orderTickets: true,
};
export const defaultTakeoutFee = 2;

interface TSettingsRow {
  name: string;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  receipt_footer_message: string | null;
  pix_qr_code_url: string | null;
  feature_flags: TStoreSettings["featureFlags"];
  takeout_fee: number;
}

interface TOperatorRow {
  id: number;
  name: string;
  pin: string;
  allowed_routes: string[];
}

function operatorFromRow(row: TOperatorRow): TOperator {
  return { id: row.id, name: row.name, pin: row.pin, allowedRoutes: row.allowed_routes };
}

async function fetchSettings(): Promise<TStoreSettings> {
  const [{ data: settingsRow, error: settingsError }, { data: operatorRows, error: operatorsError }] = await Promise.all([
    supabase.from("settings").select("*").single(),
    supabase.from("operators").select("*").order("id"),
  ]);

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (operatorsError) {
    throw new Error(operatorsError.message);
  }

  const row = settingsRow as TSettingsRow;

  return {
    name: row.name,
    cnpj: row.cnpj,
    address: row.address,
    phone: row.phone,
    logoUrl: row.logo_url,
    receiptFooterMessage: row.receipt_footer_message,
    pixQrCodeUrl: row.pix_qr_code_url,
    featureFlags: row.feature_flags,
    takeoutFee: Number(row.takeout_fee),
    operators: (operatorRows as TOperatorRow[]).map(operatorFromRow),
  };
}

function hasSettingsAccess(operators: TOperator[]): boolean {
  return operators.some((operator) => operator.allowedRoutes.includes("/settings"));
}

export const settingsStore = {
  getSettings: async (): Promise<TStoreSettings> => {
    return fetchSettings();
  },

  updateSettings: async (input: TStoreSettings): Promise<TStoreSettings> => {
    const establishmentId = await getEstablishmentId();

    const { error } = await supabase
      .from("settings")
      .update({
        name: input.name.trim(),
        cnpj: input.cnpj?.trim() || null,
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
        logo_url: input.logoUrl || null,
        receipt_footer_message: input.receiptFooterMessage?.trim() || null,
        pix_qr_code_url: input.pixQrCodeUrl || null,
        feature_flags: input.featureFlags,
        takeout_fee: Math.max(0, Number(input.takeoutFee) || 0),
      })
      .eq("establishment_id", establishmentId);

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["settings"]);

    return fetchSettings();
  },

  addOperator: async (name: string, pin: string, allowedRoutes: string[]): Promise<TOperator> => {
    const establishmentId = await getEstablishmentId();

    const { data: existingOperators, error: existingError } = await supabase.from("operators").select("id");

    if (existingError) {
      throw new Error(existingError.message);
    }

    let finalAllowedRoutes = allowedRoutes;

    if (existingOperators.length === 0 && !allowedRoutes.includes("/settings")) {
      finalAllowedRoutes = [...allowedRoutes, "/settings"];
    }

    const { data, error } = await supabase
      .from("operators")
      .insert({ name: name.trim(), pin: pin.trim(), allowed_routes: finalAllowedRoutes, establishment_id: establishmentId })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["settings"]);

    return operatorFromRow(data as TOperatorRow);
  },

  deleteOperator: async (operatorId: number): Promise<void> => {
    const { data: operatorRows, error: fetchError } = await supabase.from("operators").select("*");

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const operators = (operatorRows as TOperatorRow[]).map(operatorFromRow);
    const remainingOperators = operators.filter((operator) => operator.id !== operatorId);

    if (!hasSettingsAccess(remainingOperators)) {
      throw new Error("Não é possível excluir esse operador. Cadastre outro operador com acesso às configurações antes de excluir esse.");
    }

    const { error } = await supabase.from("operators").delete().eq("id", operatorId);

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["settings"]);
  },
};
