"use client";

import { useState } from "react";

import { Switch } from "@/_components/ui/switch";
import { Input } from "@/_components/ui/input";
import { SettingRow } from "@/_components/ui/setting-row";
import { ThemeToggle } from "@/_components/app/theme-toggle";
import type { TFeatureFlags, TStoreSettings } from "../../order/interface";

import { useUpdateSettings } from "../mutation/useUpdateSettings";

const OTHER_FEATURE_FLAG_OPTIONS: { key: keyof TFeatureFlags; label: string; description: string; defaultValue: boolean }[] = [
  {
    key: "orderTickets",
    label: "Comandas",
    description: "Desative se o seu negócio não controla comandas. O PDV vira um caixa direto.",
    defaultValue: true,
  },
  {
    key: "orderGrouping",
    label: "Junto com",
    description: "Permite vincular comandas separadas que devem ser servidas juntas.",
    defaultValue: true,
  },
  {
    key: "splitBill",
    label: "Dividir conta",
    description: "Permite dividir o pagamento igualmente ou por item entre pessoas.",
    defaultValue: true,
  },
  {
    key: "creditSale",
    label: "Venda fiado",
    description: "Permite vender fiado, registrando o cliente e cobrando depois.",
    defaultValue: false,
  },
];

export function FeatureFlagsSection({ settings }: { settings: TStoreSettings | undefined }) {
  const updateSettings = useUpdateSettings();
  const [takeoutFeeInput, setTakeoutFeeInput] = useState<string | null>(null);

  function handleToggle(key: keyof TFeatureFlags, value: boolean) {
    if (!settings) {
      return;
    }

    updateSettings.mutate({ ...settings, featureFlags: { ...settings.featureFlags, [key]: value } });
  }

  function handleTakeoutFeeBlur() {
    if (!settings || takeoutFeeInput === null) {
      return;
    }

    updateSettings.mutate({ ...settings, takeoutFee: Math.max(0, Number(takeoutFeeInput) || 0) });
    setTakeoutFeeInput(null);
  }

  const takeoutFeeDisplayValue = takeoutFeeInput ?? (settings ? String(settings.takeoutFee) : "");

  return (
    <div className="max-w-lg space-y-3">
      <div>
        <p className="text-sm font-medium">Funcionalidades</p>
        <p className="text-xs text-muted-foreground">Ative ou desative recursos extras do PDV.</p>
      </div>

      <div className="flex flex-col gap-2">
        <SettingRow label="Tema escuro" description="Alterna a aparência do sistema entre claro e escuro.">
          <ThemeToggle />
        </SettingRow>

        <SettingRow
          label="Para levar"
          description="Permite marcar a comanda como para levar e cobrar a embalagem."
          extra={
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Valor da embalagem</label>
              <div className="relative w-24">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  R$
                </span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="pl-7"
                  placeholder="0,00"
                  value={takeoutFeeDisplayValue}
                  onChange={(e) => setTakeoutFeeInput(e.target.value)}
                  onBlur={handleTakeoutFeeBlur}
                />
              </div>
            </div>
          }
        >
          <Switch checked={settings?.featureFlags.takeout ?? true} onCheckedChange={(value) => handleToggle("takeout", value)} />
        </SettingRow>

        {OTHER_FEATURE_FLAG_OPTIONS.map((option) => (
          <SettingRow key={option.key} label={option.label} description={option.description}>
            <Switch
              checked={settings?.featureFlags[option.key] ?? option.defaultValue}
              onCheckedChange={(value) => handleToggle(option.key, value)}
            />
          </SettingRow>
        ))}
      </div>
    </div>
  );
}
