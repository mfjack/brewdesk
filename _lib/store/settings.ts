import type { TOperator, TStoreSettings } from "@/app/order/interface";
import type { TOperatorRole } from "@/_lib/operator-roles";
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

  addOperator: (name: string, pin: string, role: TOperatorRole) => {
    const operator: TOperator = {
      id: 0,
      name: name.trim(),
      pin: pin.trim(),
      // O primeiro operador cadastrado vira gerente pra garantir que sempre exista alguém com acesso às configurações.
      role,
    };

    updateStore((data) => {
      operator.id = data.nextIds.operator++;
      operator.role = data.settings.operators.length === 0 ? "GERENTE" : role;

      data.settings.operators.push(operator);
    });

    return operator;
  },

  deleteOperator: (operatorId: number) => {
    updateStore((data) => {
      const operator = data.settings.operators.find((item) => item.id === operatorId);

      if (operator?.role === "GERENTE") {
        const remainingManagers = data.settings.operators.filter((item) => item.role === "GERENTE" && item.id !== operatorId);

        if (remainingManagers.length === 0) {
          throw new Error("Não é possível excluir o único operador gerente. Cadastre outro gerente antes de excluir esse.");
        }
      }

      data.settings.operators = data.settings.operators.filter((operator) => operator.id !== operatorId);
    });
  },
};
