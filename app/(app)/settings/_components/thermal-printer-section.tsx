"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Printer } from "lucide-react";

import { SettingRow } from "@/_components/ui/setting-row";
import { Switch } from "@/_components/ui/switch";
import { Button } from "@/_components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import { useIsHydrated } from "@/_lib/use-is-hydrated";
import {
  connectThermalPrinter,
  getSavedThermalPrinterName,
  isThermalPrintingSupported,
  reconnectThermalPrinter,
  setThermalPrintingEnabled,
  useThermalPrintingEnabled,
} from "@/_lib/thermal-printer";
import { useUpdateSettings } from "../mutation/useUpdateSettings";
import type { TStoreSettings, TThermalPrinterPaperWidth } from "../../order/interface";

export function ThermalPrinterSection({ settings }: { settings: TStoreSettings | undefined }) {
  const isHydrated = useIsHydrated();
  const isEnabled = useThermalPrintingEnabled();
  const isSupported = isHydrated && isThermalPrintingSupported();
  const updateSettings = useUpdateSettings();

  // Falls back to the saved pairing (read straight from localStorage — safe once
  // isHydrated is true, no effect needed since it's a synchronous, side-effect-free read)
  // until a live reconnect below confirms the printer and overrides it with fresh state.
  const [reconnectedPrinterName, setReconnectedPrinterName] = useState<string | null>(null);
  const printerName = reconnectedPrinterName ?? (isHydrated ? getSavedThermalPrinterName() : null);

  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    reconnectThermalPrinter()
      .then((printer) => printer && setReconnectedPrinterName(printer.productName))
      .catch(() => undefined);
  }, [isSupported]);

  function handlePaperWidthChange(value: TThermalPrinterPaperWidth) {
    if (!settings) {
      return;
    }

    updateSettings.mutate({ ...settings, featureFlags: { ...settings.featureFlags, thermalPrinterPaperWidth: value } });
  }

  async function handleConnect() {
    setIsConnecting(true);
    setError(null);

    try {
      const printer = await connectThermalPrinter();

      setReconnectedPrinterName(printer.productName);
      toast.success("Impressora pareada com sucesso!");
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const message = `Não foi possível parear a impressora: ${reason}`;

      setError(message);
      toast.error(message);
    } finally {
      setIsConnecting(false);
    }
  }

  if (!isHydrated) {
    return null;
  }

  if (!isSupported) {
    return (
      <div className="max-w-lg space-y-3">
        <div>
          <p className="text-sm font-medium">Impressora térmica</p>
          <p className="text-xs text-muted-foreground">
            Esse navegador não tem suporte a impressão direta via USB. Use Chrome ou Edge no computador que roda o PDV.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-3">
      <div>
        <p className="text-sm font-medium">Impressora térmica</p>
        <p className="text-xs text-muted-foreground">
          Imprime a comanda direto na impressora térmica conectada por USB, sem abrir a tela de impressão do
          navegador. Só funciona no Chrome ou Edge, e precisa ser configurado em cada computador que for imprimir.
        </p>
      </div>

      <SettingRow
        label="Imprimir direto na impressora"
        description={printerName ? `Impressora pareada: ${printerName}` : "Nenhuma impressora pareada ainda."}
      >
        <Switch checked={isEnabled} onCheckedChange={setThermalPrintingEnabled} />
      </SettingRow>

      <Button type="button" variant="outline" onClick={handleConnect} disabled={isConnecting}>
        <Printer />
        {isConnecting ? "Pareando..." : "Parear impressora"}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <SettingRow label="Largura do papel" description="Ajusta a quantidade de caracteres por linha pro tamanho do rolo usado.">
        <Select
          value={settings?.featureFlags.thermalPrinterPaperWidth ?? "80mm"}
          onValueChange={handlePaperWidthChange}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="58mm">58mm</SelectItem>
            <SelectItem value="80mm">80mm</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  );
}
