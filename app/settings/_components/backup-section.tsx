"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { localStore } from "@/_lib/store";

import { useImportData } from "../mutation/useImportData";

export function BackupSection() {
  const importData = useImportData();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  function handleExportData() {
    const data = localStore.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `brewdesk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));

        const confirmed = window.confirm(
          "Importar esse arquivo vai substituir todos os dados atuais (produtos, categorias, comandas e configurações). Deseja continuar?",
        );

        if (!confirmed) {
          return;
        }

        importData.mutate(parsed, {
          onSuccess: () => setImportSuccess(true),
          onError: () => setImportError("Não foi possível importar o arquivo."),
        });
      } catch {
        setImportError("Arquivo inválido. Selecione um backup exportado pelo BrewDesk.");
      } finally {
        if (importInputRef.current) {
          importInputRef.current.value = "";
        }
      }
    };

    reader.readAsText(file);
  }

  return (
    <div className="max-w-lg space-y-3">
      <div>
        <p className="text-sm font-medium">Backup dos dados</p>
        <p className="text-xs text-muted-foreground">
          Os dados ficam salvos apenas nesse navegador. Exporte um backup regularmente pra não perder informações.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={handleExportData}>
          <Download />
          Exportar dados
        </Button>

        <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()}>
          <Upload />
          Importar dados
        </Button>

        <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFileChange} />
      </div>

      {importError && <p className="text-xs text-destructive">{importError}</p>}
      {importSuccess && <p className="text-xs text-muted-foreground">Dados importados com sucesso.</p>}
    </div>
  );
}
