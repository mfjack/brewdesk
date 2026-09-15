import { supabase } from "@/_lib/supabase/client";
import { getEstablishmentId } from "@/_lib/supabase/establishment";
import { notifyStoreChange } from "@/_lib/store/notify-store-change";

interface TBackupData {
  categories: Record<string, unknown>[];
  suppliers: Record<string, unknown>[];
  supply_items: Record<string, unknown>[];
  products: Record<string, unknown>[];
  operators: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  settings: Record<string, unknown>;
}

function isValidBackupShape(input: unknown): input is TBackupData {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const candidate = input as Partial<TBackupData>;
  const arrayFields: (keyof TBackupData)[] = ["categories", "suppliers", "supply_items", "products", "operators", "orders"];

  for (const field of arrayFields) {
    if (candidate[field] !== undefined && !Array.isArray(candidate[field])) {
      return false;
    }
  }

  if (candidate.settings !== undefined && (typeof candidate.settings !== "object" || candidate.settings === null)) {
    return false;
  }

  return true;
}

function omitIdAndEstablishment<T extends Record<string, unknown>>(row: T): Omit<T, "id" | "establishment_id"> {
  const clone: Record<string, unknown> = { ...row };

  delete clone.id;
  delete clone.establishment_id;

  return clone as Omit<T, "id" | "establishment_id">;
}

function buildIdMap(originalRows: { id: unknown }[], insertedRows: { id: number }[]): Map<number, number> {
  const map = new Map<number, number>();

  originalRows.forEach((row, index) => {
    map.set(Number(row.id), insertedRows[index].id);
  });

  return map;
}

async function deleteAllRows(table: string) {
  const { error } = await supabase.from(table).delete().gt("id", 0);

  if (error) {
    throw new Error(error.message);
  }
}

export const backupStore = {
  exportData: async (): Promise<TBackupData> => {
    const [categories, suppliers, supplyItems, products, operators, orders, settings] = await Promise.all([
      supabase.from("categories").select("*"),
      supabase.from("suppliers").select("*"),
      supabase.from("supply_items").select("*"),
      supabase.from("products").select("*"),
      supabase.from("operators").select("*"),
      supabase.from("orders").select("*"),
      supabase.from("settings").select("*").single(),
    ]);

    for (const result of [categories, suppliers, supplyItems, products, operators, orders, settings]) {
      if (result.error) {
        throw new Error(result.error.message);
      }
    }

    return {
      categories: categories.data ?? [],
      suppliers: suppliers.data ?? [],
      supply_items: supplyItems.data ?? [],
      products: products.data ?? [],
      operators: operators.data ?? [],
      orders: orders.data ?? [],
      settings: settings.data ?? {},
    };
  },

  importData: async (input: unknown): Promise<void> => {
    if (!isValidBackupShape(input)) {
      throw new Error("Arquivo de backup inválido ou de um formato incompatível.");
    }

    const backup = input;
    const establishmentId = await getEstablishmentId();

    await deleteAllRows("orders");
    await deleteAllRows("products");
    await deleteAllRows("supply_items");
    await deleteAllRows("operators");
    await deleteAllRows("suppliers");
    await deleteAllRows("categories");

    const categoryRows = backup.categories.map((row) => ({ ...omitIdAndEstablishment(row), establishment_id: establishmentId }));
    const { data: insertedCategories, error: categoriesError } =
      categoryRows.length > 0 ? await supabase.from("categories").insert(categoryRows).select() : { data: [], error: null };

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }

    const categoryIdMap = buildIdMap(backup.categories as { id: unknown }[], insertedCategories ?? []);

    const supplierRows = backup.suppliers.map((row) => ({ ...omitIdAndEstablishment(row), establishment_id: establishmentId }));
    const { data: insertedSuppliers, error: suppliersError } =
      supplierRows.length > 0 ? await supabase.from("suppliers").insert(supplierRows).select() : { data: [], error: null };

    if (suppliersError) {
      throw new Error(suppliersError.message);
    }

    const supplierIdMap = buildIdMap(backup.suppliers as { id: unknown }[], insertedSuppliers ?? []);

    const supplyItemRows = backup.supply_items.map((row) => ({
      ...omitIdAndEstablishment(row),
      establishment_id: establishmentId,
      supplier_id: row.supplier_id ? supplierIdMap.get(Number(row.supplier_id)) ?? null : null,
    }));
    const { data: insertedSupplyItems, error: supplyItemsError } =
      supplyItemRows.length > 0 ? await supabase.from("supply_items").insert(supplyItemRows).select() : { data: [], error: null };

    if (supplyItemsError) {
      throw new Error(supplyItemsError.message);
    }

    const supplyItemIdMap = buildIdMap(backup.supply_items as { id: unknown }[], insertedSupplyItems ?? []);

    const productRows = backup.products.map((row) => ({
      ...omitIdAndEstablishment(row),
      establishment_id: establishmentId,
      category_id: categoryIdMap.get(Number(row.category_id)) ?? null,
      supplier_id: row.supplier_id ? supplierIdMap.get(Number(row.supplier_id)) ?? null : null,
      recipe: (row.recipe as { supplyItemId: number }[] | null)?.map((item) => ({
        ...item,
        supplyItemId: supplyItemIdMap.get(Number(item.supplyItemId)) ?? item.supplyItemId,
      })),
    }));
    const { data: insertedProducts, error: productsError } =
      productRows.length > 0 ? await supabase.from("products").insert(productRows).select() : { data: [], error: null };

    if (productsError) {
      throw new Error(productsError.message);
    }

    const productIdMap = buildIdMap(backup.products as { id: unknown }[], insertedProducts ?? []);

    const operatorRows = backup.operators.map((row) => ({ ...omitIdAndEstablishment(row), establishment_id: establishmentId }));

    if (operatorRows.length > 0) {
      const { error: operatorsError } = await supabase.from("operators").insert(operatorRows);

      if (operatorsError) {
        throw new Error(operatorsError.message);
      }
    }

    const orderRows = backup.orders.map((row) => ({
      ...omitIdAndEstablishment(row),
      establishment_id: establishmentId,
      group_id: null,
      order_items: (row.order_items as ({ product: { id: number } } | null)[] | null)?.map((item) =>
        item
          ? { ...item, product: { ...item.product, id: productIdMap.get(Number(item.product.id)) ?? item.product.id } }
          : item,
      ),
    }));
    const { data: insertedOrders, error: ordersError } =
      orderRows.length > 0 ? await supabase.from("orders").insert(orderRows).select() : { data: [], error: null };

    if (ordersError) {
      throw new Error(ordersError.message);
    }

    const orderIdMap = buildIdMap(backup.orders as { id: unknown }[], insertedOrders ?? []);

    await Promise.all(
      (backup.orders as { id: unknown; group_id: unknown }[]).map(async (originalOrder) => {
        if (!originalOrder.group_id) {
          return;
        }

        const newOrderId = orderIdMap.get(Number(originalOrder.id));
        const newGroupId = orderIdMap.get(Number(originalOrder.group_id));

        if (!newOrderId || !newGroupId) {
          return;
        }

        const { error } = await supabase.from("orders").update({ group_id: newGroupId }).eq("id", newOrderId);

        if (error) {
          throw new Error(error.message);
        }
      }),
    );

    const settingsFields = omitIdAndEstablishment(backup.settings as { id?: unknown; establishment_id?: unknown } & Record<string, unknown>);

    const { error: settingsError } = await supabase.from("settings").update(settingsFields).eq("establishment_id", establishmentId);

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    notifyStoreChange(["categories", "suppliers", "supplyItems", "products", "settings", "orders", "order", "report"]);
  },
};
