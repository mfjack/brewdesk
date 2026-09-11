import type { TCategory, TProduct } from "@/app/order/interface";
import { readStore, updateStore, writeStore } from "./storage";

export interface TProductInput {
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  price: number;
  costPrice?: number;
  quantity?: number;
  trackStock?: boolean;
  lowStockThreshold?: number;
  categoryId: number;
  supplierId?: number | null;
}

function buildProductFields(input: TProductInput, category: TCategory): Omit<TProduct, "id"> {
  const trackStock = input.trackStock ?? true;

  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    photoUrl: input.photoUrl || null,
    price: Number(input.price),
    costPrice: Number(input.costPrice ?? 0),
    quantity: trackStock ? Number(input.quantity ?? 0) : 0,
    trackStock,
    lowStockThreshold: trackStock ? Number(input.lowStockThreshold ?? 5) : 0,
    category,
    supplierId: input.supplierId ?? null,
  };
}

export const productStore = {
  getProducts: () => {
    return readStore().products;
  },

  createProduct: (input: TProductInput) => {
    const data = readStore();

    const category = data.categories.find((item) => item.id === input.categoryId);

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    const product: TProduct = {
      id: data.nextIds.product++,
      ...buildProductFields(input, category),
    };

    data.products.push(product);

    writeStore(data);

    return product;
  },

  updateProduct: (productId: number, input: TProductInput) => {
    const data = readStore();

    const product = data.products.find((item) => item.id === productId);

    if (!product) {
      throw new Error("Produto não encontrado");
    }

    const category = data.categories.find((item) => item.id === input.categoryId);

    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    Object.assign(product, buildProductFields(input, category));

    writeStore(data);

    return product;
  },

  deleteProduct: (productId: number) => {
    updateStore((data) => {
      data.products = data.products.filter((product) => product.id !== productId);
    });
  },
};
