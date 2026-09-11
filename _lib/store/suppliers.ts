import type { TSupplier } from "@/app/order/interface";
import { readStore, updateStore, writeStore } from "./storage";

export interface TSupplierInput {
  companyName: string;
  whatsapp?: string | null;
  suppliesDescription?: string | null;
  paymentTerms?: string | null;
  deliveryDays?: string[];
  deliveryPeriod?: string | null;
}

function buildSupplierFields(input: TSupplierInput): Omit<TSupplier, "id"> {
  return {
    companyName: input.companyName.trim(),
    whatsapp: input.whatsapp?.trim() || null,
    suppliesDescription: input.suppliesDescription?.trim() || null,
    paymentTerms: input.paymentTerms?.trim() || null,
    deliveryDays: input.deliveryDays ?? [],
    deliveryPeriod: input.deliveryPeriod || null,
  };
}

export const supplierStore = {
  getSuppliers: () => {
    return readStore().suppliers;
  },

  createSupplier: (input: TSupplierInput) => {
    const data = readStore();

    const supplier: TSupplier = {
      id: data.nextIds.supplier++,
      ...buildSupplierFields(input),
    };

    data.suppliers.push(supplier);

    writeStore(data);

    return supplier;
  },

  updateSupplier: (supplierId: number, input: TSupplierInput) => {
    const data = readStore();

    const supplier = data.suppliers.find((item) => item.id === supplierId);

    if (!supplier) {
      throw new Error("Fornecedor não encontrado");
    }

    Object.assign(supplier, buildSupplierFields(input));

    writeStore(data);

    return supplier;
  },

  deleteSupplier: (supplierId: number) => {
    updateStore((data) => {
      data.suppliers = data.suppliers.filter((supplier) => supplier.id !== supplierId);

      data.products.forEach((product) => {
        if (product.supplierId === supplierId) {
          product.supplierId = null;
        }
      });
    });
  },
};
