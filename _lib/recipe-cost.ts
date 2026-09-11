import type { TRecipeItem, TSupplyItem } from "@/app/order/interface";
import { getSupplyTotal } from "./supply-units";

export function getSupplyUnitCost(supplyItem: TSupplyItem): number {
  const total = getSupplyTotal(supplyItem.quantity, supplyItem.unitContent);

  return total > 0 ? supplyItem.costPrice / total : 0;
}

export function getRecipeCost(recipe: TRecipeItem[], supplyItems: TSupplyItem[]): number {
  return recipe.reduce((sum, recipeItem) => {
    const supplyItem = supplyItems.find((item) => item.id === recipeItem.supplyItemId);

    return sum + (supplyItem ? recipeItem.quantity * getSupplyUnitCost(supplyItem) : 0);
  }, 0);
}

export function getMaxProducibleQuantity(recipe: TRecipeItem[], supplyItems: TSupplyItem[]): number | null {
  if (recipe.length === 0) {
    return null;
  }

  let max = Infinity;

  for (const recipeItem of recipe) {
    const supplyItem = supplyItems.find((item) => item.id === recipeItem.supplyItemId);

    if (!supplyItem || recipeItem.quantity <= 0) {
      return 0;
    }

    const total = getSupplyTotal(supplyItem.quantity, supplyItem.unitContent);

    max = Math.min(max, Math.floor(total / recipeItem.quantity));
  }

  return Math.max(max, 0);
}
