import { categoryStore } from "./categories";
import { productStore } from "./products";
import { orderStore } from "./orders";
import { settingsStore } from "./settings";
import { supplierStore } from "./suppliers";
import { supplyItemStore } from "./supply-items";
import { taskStore } from "./tasks";

export const localStore = {
  ...categoryStore,
  ...productStore,
  ...orderStore,
  ...settingsStore,
  ...supplierStore,
  ...supplyItemStore,
  ...taskStore,
};
