"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Printer } from "lucide-react";

import { SettingRow } from "@/_components/ui/setting-row";
import { Switch } from "@/_components/ui/switch";
import { Button } from "@/_components/ui/button";
import { useIsHydrated } from "@/_lib/use-is-hydrated";
import {
  connectThermalPrinter,
  isThermalPrintingSupported,
  reconnectThermalPrinter,
  setThermalPrintingEnabled,
  useThermalPrintingEnabled,
} from "@/_lib/thermal-printer";

export function ThermalPrinterSection() {
  const isHydrated = useIsHydrated();
  const isEnabled = useThermalPrintingEnabled();
  const isSupported = isHydrated && isThermalPrintingSupported();

  const [printerName, setPrinterName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    reconnectThermalPrinter()
      .then((printer) => setPrinterName(printer?.productName ?? null))
      .catch(() => undefined);
  }, [isSupported]);

  async function handleConnect() {
    setIsConnecting(true);
    setError(null);

    try {
      const printer = await connectThermalPrinter();

      setPrinterName(printer.productName);
      toast.success("Impressora pareada com sucesso!");
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const message = `Não foi possível parear a impressora (${reason}). Tenta de novo e seleciona ela na lista.`;

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
    </div>
  );
}
