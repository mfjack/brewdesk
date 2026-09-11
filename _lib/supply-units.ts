export const SUPPLY_UNITS = ["kg", "g", "L", "ml", "unidade"] as const;

const UNIT_LABELS: Record<string, string> = { unidade: "un" };

export function formatUnit(unit: string): string {
  return UNIT_LABELS[unit] ?? unit;
}

export function getSupplyTotal(quantity: number, unitContent: number | null): number {
  return quantity * (unitContent && unitContent > 0 ? unitContent : 1);
}

const WEIGHT_UNITS_IN_GRAMS: Record<string, number> = { kg: 1000, g: 1 };
const VOLUME_UNITS_IN_ML: Record<string, number> = { L: 1000, ml: 1 };

export function getCompatibleUnits(unit: string): readonly string[] {
  if (unit in WEIGHT_UNITS_IN_GRAMS) {
    return Object.keys(WEIGHT_UNITS_IN_GRAMS);
  }

  if (unit in VOLUME_UNITS_IN_ML) {
    return Object.keys(VOLUME_UNITS_IN_ML);
  }

  return [unit];
}

export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) {
    return quantity;
  }

  if (fromUnit in WEIGHT_UNITS_IN_GRAMS && toUnit in WEIGHT_UNITS_IN_GRAMS) {
    return (quantity * WEIGHT_UNITS_IN_GRAMS[fromUnit]) / WEIGHT_UNITS_IN_GRAMS[toUnit];
  }

  if (fromUnit in VOLUME_UNITS_IN_ML && toUnit in VOLUME_UNITS_IN_ML) {
    return (quantity * VOLUME_UNITS_IN_ML[fromUnit]) / VOLUME_UNITS_IN_ML[toUnit];
  }

  return quantity;
}
