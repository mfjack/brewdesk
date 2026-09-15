import type { TProduct, TSupplier, TSupplyItem } from "@/app/(app)/order/interface";
import { formatUnit, isBelowMinQuantity } from "@/_lib/supply-units";
import { toTitleCase } from "@/_lib/to-title-case";

export interface TShoppingListItem {
  id: string;
  name: string;
  quantityLabel: string;
}

export interface TShoppingListGroup {
  supplier: TSupplier | null;
  items: TShoppingListItem[];
}

export function buildShoppingListGroups(supplyItems: TSupplyItem[], products: TProduct[], suppliers: TSupplier[]): TShoppingListGroup[] {
  const groups = new Map<number | null, TShoppingListGroup>();

  function pushItem(supplierId: number | null, item: TShoppingListItem) {
    const supplier = supplierId ? (suppliers.find((candidate) => candidate.id === supplierId) ?? null) : null;
    const key = supplier?.id ?? null;

    const existing = groups.get(key);

    if (existing) {
      existing.items.push(item);

      return;
    }

    groups.set(key, { supplier, items: [item] });
  }

  supplyItems
    .filter((item) => isBelowMinQuantity(item.quantity, item.unit, item.minQuantity, item.minQuantityUnit))
    .forEach((item) => {
      pushItem(item.supplierId, {
        id: `supply-${item.id}`,
        name: item.name,
        quantityLabel: `${Number(item.quantity.toFixed(2))}${formatUnit(item.unit)} (mín. ${Number(item.minQuantity.toFixed(2))}${formatUnit(item.minQuantityUnit)})`,
      });
    });

  products
    .filter((product) => product.trackStock && product.recipe.length === 0 && product.quantity <= (product.lowStockThreshold ?? 5))
    .forEach((product) => {
      pushItem(product.supplierId, {
        id: `product-${product.id}`,
        name: product.name,
        quantityLabel: `${product.quantity} un. (mín. ${product.lowStockThreshold ?? 5} un.)`,
      });
    });

  return Array.from(groups.values()).sort((a, b) => {
    if (!a.supplier) {
      return 1;
    }

    if (!b.supplier) {
      return -1;
    }

    return a.supplier.companyName.localeCompare(b.supplier.companyName);
  });
}

export function buildShoppingOrderMessage(items: TShoppingListItem[]): string {
  return `Olá! Preciso repor:\n${items.map((item) => `- ${toTitleCase(item.name)}`).join("\n")}`;
}
