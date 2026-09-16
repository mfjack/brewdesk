export const SUPPLY_UNITS = ["g", "unidade"] as const;

export type SupplyUnit = (typeof SUPPLY_UNITS)[number];

const UNIT_LABELS: Record<string, string> = { unidade: "un" };

export function formatUnit(unit: string): string {
  return UNIT_LABELS[unit] ?? unit;
}

export function roundToAvoidFloatDrift(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function isBelowMinQuantity(quantity: number, minQuantity: number): boolean {
  return quantity <= minQuantity;
}

export function formatSupplyQuantity(quantity: number, unit: string): string {
  return `${Number(quantity.toFixed(2))}${formatUnit(unit)}`;
}
