import { clone, defaultSettings, initialData, readStore, writeStore, type StoreData } from "./storage";

/**
 * Confere só a forma essencial do backup — cada campo que
 * deveria ser um array precisa realmente ser um array, e
 * `settings` (se vier) precisa ser um objeto. Não valida cada
 * campo interno; o objetivo é rejeitar um arquivo claramente
 * errado antes de mesclar e persistir, não substituir um schema
 * completo.
 */
function isValidBackupShape(input: unknown): input is Partial<StoreData> {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const candidate = input as Partial<StoreData>;

  const arrayFields: (keyof StoreData)[] = ["categories", "products", "orders", "suppliers", "supplyItems"];

  for (const field of arrayFields) {
    if (candidate[field] !== undefined && !Array.isArray(candidate[field])) {
      return false;
    }
  }

  if (candidate.settings !== undefined && (typeof candidate.settings !== "object" || candidate.settings === null)) {
    return false;
  }

  if (candidate.nextIds !== undefined && (typeof candidate.nextIds !== "object" || candidate.nextIds === null)) {
    return false;
  }

  return true;
}

export const backupStore = {
  exportData: (): StoreData => {
    return readStore();
  },

  importData: (input: unknown) => {
    if (!isValidBackupShape(input)) {
      throw new Error("Arquivo de backup inválido ou de um formato incompatível.");
    }

    const parsed = input;

    const merged: StoreData = {
      ...clone(initialData),
      ...parsed,
      settings: { ...defaultSettings, ...parsed.settings },
      nextIds: { ...clone(initialData.nextIds) },
    };

    const maxId = (ids: number[]) => (ids.length > 0 ? Math.max(...ids) + 1 : 1);

    merged.nextIds.category = maxId(merged.categories.map((item) => item.id));
    merged.nextIds.product = maxId(merged.products.map((item) => item.id));
    merged.nextIds.order = maxId(merged.orders.map((item) => item.id));
    merged.nextIds.item = maxId(merged.orders.flatMap((order) => order.orderItems.map((item) => item.id)));
    merged.nextIds.operator = maxId(merged.settings.operators.map((item) => item.id));
    merged.nextIds.supplier = maxId(merged.suppliers.map((item) => item.id));
    merged.nextIds.supplyItem = maxId(merged.supplyItems.map((item) => item.id));

    writeStore(merged);

    return merged;
  },
};
