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
      featureFlags: input.featureFlags,
      takeoutFee: Math.max(0, Number(input.takeoutFee) || 0),
    };

    writeStore(data);

    return data.settings;
  },

  addOperator: (name: string, pin: string, allowedRoutes: string[]) => {
    const operator: TOperator = {
      id: 0,
      name: name.trim(),
      pin: pin.trim(),
      allowedRoutes,
    };

    updateStore((data) => {
      operator.id = data.nextIds.operator++;

      if (data.settings.operators.length === 0 && !operator.allowedRoutes.includes("/settings")) {
        operator.allowedRoutes = [...operator.allowedRoutes, "/settings"];
      }

      data.settings.operators.push(operator);
    });

    return operator;
  },

  deleteOperator: (operatorId: number) => {
    updateStore((data) => {
      const remainingOperators = data.settings.operators.filter((item) => item.id !== operatorId);

      const wouldStillHaveAccess = remainingOperators.some((operator) => operator.allowedRoutes.includes("/settings"));

      if (!wouldStillHaveAccess) {
        throw new Error("Não é possível excluir esse operador. Cadastre outro operador com acesso às configurações antes de excluir esse.");
      }

      data.settings.operators = remainingOperators;
    });
  },
};
