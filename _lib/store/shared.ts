import type { TProduct, TSupplyItem } from "@/app/(app)/order/interface";

export interface TProductRow {
  id: number;
  name: string;
  description: string | null;
  photo_url: string | null;
  price: number;
  cost_price: number;
  quantity: number;
  track_stock: boolean;
  low_stock_threshold: number;
  category_id: number;
  recipe: TProduct["recipe"];
  category: { id: number; name: string } | null;
}

export function mapProductRow(row: TProductRow): TProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    photoUrl: row.photo_url,
    price: Number(row.price),
    costPrice: Number(row.cost_price),
    quantity: Number(row.quantity),
    trackStock: row.track_stock,
    lowStockThreshold: Number(row.low_stock_threshold),
    category: row.category ?? { id: row.category_id, name: "" },
    recipe: row.recipe ?? [],
  };
}

export interface TSupplyItemRow {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  initial_quantity: number;
  unit: TSupplyItem["unit"];
  min_quantity: number;
  cost_price: number;
  supplier_id: number | null;
  expires_at: string | null;
}

export function mapSupplyItemRow(row: TSupplyItemRow): TSupplyItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    quantity: Number(row.quantity),
    initialQuantity: Number(row.initial_quantity),
    unit: row.unit,
    minQuantity: Number(row.min_quantity),
    costPrice: Number(row.cost_price),
    supplierId: row.supplier_id,
    expiresAt: row.expires_at,
  };
}
