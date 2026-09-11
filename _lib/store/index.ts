import { categoryStore } from "./categories";
import { productStore } from "./products";
import { orderStore } from "./orders";
import { settingsStore } from "./settings";
import { backupStore } from "./backup";

export const localStore = {
  ...categoryStore,
  ...productStore,
  ...orderStore,
  ...settingsStore,
  ...backupStore,
};
