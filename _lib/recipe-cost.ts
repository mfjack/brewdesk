import type { TOrderItem, TProduct, TRecipeItem, TSupplyItem } from "@/app/order/interface";

export function getSupplyUnitCost(supplyItem: TSupplyItem): number {
  return supplyItem.quantity > 0 ? supplyItem.costPrice / supplyItem.quantity : 0;
}

export function getRecipeCost(recipe: TRecipeItem[], supplyItems: TSupplyItem[]): number {
  return recipe.reduce((sum, recipeItem) => {
    const supplyItem = supplyItems.find((item) => item.id === recipeItem.supplyItemId);

    return sum + (supplyItem ? recipeItem.quantity * getSupplyUnitCost(supplyItem) : 0);
  }, 0);
}

export function getMaxProducibleQuantity(
  recipe: TRecipeItem[],
  supplyItems: TSupplyItem[],
  reservedQuantities: Record<number, number> = {},
): number | null {
  if (recipe.length === 0) {
    return null;
  }

  let max = Infinity;

  for (const recipeItem of recipe) {
    const supplyItem = supplyItems.find((item) => item.id === recipeItem.supplyItemId);

    if (!supplyItem || recipeItem.quantity <= 0) {
      return 0;
    }

    const remaining = supplyItem.quantity - (reservedQuantities[recipeItem.supplyItemId] ?? 0);

    max = Math.min(max, Math.floor(remaining / recipeItem.quantity));
  }

  return Math.max(max, 0);
}

export function buildReservedSupplyQuantities(
  orderItems: Pick<TOrderItem, "product" | "quantity">[],
  products: TProduct[],
): Record<number, number> {
  const reserved: Record<number, number> = {};

  orderItems.forEach((orderItem) => {
    const product = products.find((item) => item.id === orderItem.product.id);

    product?.recipe.forEach((recipeItem) => {
      reserved[recipeItem.supplyItemId] = (reserved[recipeItem.supplyItemId] ?? 0) + recipeItem.quantity * orderItem.quantity;
    });
  });

  return reserved;
}
