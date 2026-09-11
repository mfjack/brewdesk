import { clone, defaultSettings, initialData, readStore, writeStore, type StoreData } from "./storage";

export const backupStore = {
  exportData: (): StoreData => {
    return readStore();
  },

  importData: (input: unknown) => {
    const parsed = input as Partial<StoreData>;

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

    writeStore(merged);

    return merged;
  },
};
