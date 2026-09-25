"use client";

import { useId, useState } from "react";

import { Switch } from "@/_components/ui/switch";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { SettingRow } from "@/_components/ui/setting-row";
import { ThemeToggle } from "@/_components/app/theme-toggle";
import { useIsHydrated } from "@/_lib/use-is-hydrated";
import { useIsMasterOperator } from "@/_lib/operator-session";
import type { TFeatureFlags, TStoreSettings } from "../../order/interface";

import { useUpdateSettings } from "../mutation/useUpdateSettings";

// Excludes non-boolean settings (like thermalPrinterPaperWidth) from this generic
// on/off list — those get their own dedicated control instead of a plain Switch.
type TBooleanFeatureFlagKey = { [K in keyof TFeatureFlags]: TFeatureFlags[K] extends boolean ? K : never }[keyof TFeatureFlags];

const OTHER_FEATURE_FLAG_OPTIONS: { key: TBooleanFeatureFlagKey; label: string; description: string; defaultValue: boolean }[] = [
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
    label: "Venda na conta",
    description: "Permite vender na conta, registrando o cliente e cobrando depois.",
    defaultValue: false,
  },
  {
    key: "receiptCategories",
    label: "Categorias na comanda",
    description: "Isso mostra o nome de cada categoria acima do grupo.",
    defaultValue: true,
  },
];

export function FeatureFlagsSection({ settings }: { settings: TStoreSettings | undefined }) {
  const updateSettings = useUpdateSettings();
  const isHydrated = useIsHydrated();
  const isMaster = useIsMasterOperator(settings?.operators);
  const takeoutFeeId = useId();
  const [takeoutFeeInput, setTakeoutFeeInput] = useState<string | null>(null);

  function handleToggle(key: TBooleanFeatureFlagKey, value: boolean) {
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

  const takeoutFeeDisplayValue = takeoutFeeInput ?? (settings && settings.takeoutFee > 0 ? String(settings.takeoutFee) : "");

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

        {!isMaster && (
          <p className="text-xs text-muted-foreground">Apenas o operador master pode alterar essas funcionalidades.</p>
        )}

        <fieldset disabled={!isMaster} className="flex flex-col gap-2">
          <SettingRow
            label="Para levar"
            description="Permite marcar a comanda como para levar e cobrar a embalagem."
            extra={
              <div className="flex items-center gap-2">
                <Label htmlFor={takeoutFeeId} className="text-xs font-normal text-muted-foreground whitespace-nowrap">
                  Valor da embalagem
                </Label>
                <div className="relative w-24">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id={takeoutFeeId}
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
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
            <Switch
              checked={isHydrated && (settings?.featureFlags.takeout ?? true)}
              onCheckedChange={(value) => handleToggle("takeout", value)}
            />
          </SettingRow>

          {OTHER_FEATURE_FLAG_OPTIONS.map((option) => (
            <SettingRow key={option.key} label={option.label} description={option.description}>
              <Switch
                checked={isHydrated && (settings?.featureFlags[option.key] ?? option.defaultValue)}
                onCheckedChange={(value) => handleToggle(option.key, value)}
              />
            </SettingRow>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
