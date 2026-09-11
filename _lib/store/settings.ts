import type { TOperator, TStoreSettings } from "@/app/order/interface";
import { readStore, updateStore, writeStore } from "./storage";

export const settingsStore = {
  getSettings: () => {
    return readStore().settings;
  },

  updateSettings: (input: TStoreSettings) => {
    const data = readStore();

    data.settings = {
      name: input.name.trim(),
      cnpj: input.cnpj?.trim() || null,
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
      logoUrl: input.logoUrl || null,
      receiptFooterMessage: input.receiptFooterMessage?.trim() || null,
      operators: data.settings.operators,
      pixQrCodeUrl: input.pixQrCodeUrl || null,
    };

    writeStore(data);

    return data.settings;
  },

  addOperator: (name: string, pin: string) => {
    const operator: TOperator = {
      id: 0,
      name: name.trim(),
      pin: pin.trim(),
    };

    updateStore((data) => {
      operator.id = data.nextIds.operator++;

      data.settings.operators.push(operator);
    });

    return operator;
  },

  deleteOperator: (operatorId: number) => {
    updateStore((data) => {
      data.settings.operators = data.settings.operators.filter((operator) => operator.id !== operatorId);
    });
  },
};
