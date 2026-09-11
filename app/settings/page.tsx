"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Image from "next/image";
import { Download, KeyRound, Trash2, Upload } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Textarea } from "@/_components/ui/textarea";
import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { ThemeToggle } from "@/_components/ui/theme-toggle";
import { Card } from "@/_components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { toTitleCase } from "@/_lib/to-title-case";

import { useGetSettings } from "./query/useGetSettings";
import { useUpdateSettings } from "./mutation/useUpdateSettings";
import { useAddOperator } from "./mutation/useAddOperator";
import { useDeleteOperator } from "./mutation/useDeleteOperator";
import { useImportData } from "./mutation/useImportData";
import { localStore } from "@/_lib/store";

interface TSettingsFormValues {
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  receiptFooterMessage: string;
  logoUrl: string | null;
  pixQrCodeUrl: string | null;
}

export default function SettingsPage() {
  const { data: settings } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const addOperator = useAddOperator();
  const deleteOperator = useDeleteOperator();
  const importData = useImportData();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pixQrInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [isOperatorDialogOpen, setIsOperatorDialogOpen] = useState(false);
  const [operatorName, setOperatorName] = useState("");
  const [operatorPin, setOperatorPin] = useState("");
  const [operatorError, setOperatorError] = useState<string | null>(null);

  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const { register, handleSubmit, control } = useForm<TSettingsFormValues>({
    defaultValues: { name: "", cnpj: "", phone: "", address: "", receiptFooterMessage: "", logoUrl: null, pixQrCodeUrl: null },
    values: settings
      ? {
          name: settings.name,
          cnpj: settings.cnpj ?? "",
          phone: settings.phone ?? "",
          address: settings.address ?? "",
          receiptFooterMessage: settings.receiptFooterMessage ?? "",
          logoUrl: settings.logoUrl,
          pixQrCodeUrl: settings.pixQrCodeUrl,
        }
      : undefined,
  });

  function handleSubmitSettings(data: TSettingsFormValues) {
    updateSettings.mutate({
      name: data.name,
      cnpj: data.cnpj || null,
      phone: data.phone || null,
      address: data.address || null,
      logoUrl: data.logoUrl,
      receiptFooterMessage: data.receiptFooterMessage || null,
      operators: settings?.operators ?? [],
      pixQrCodeUrl: data.pixQrCodeUrl,
    });
  }

  function handleOpenOperatorDialog() {
    setOperatorName("");
    setOperatorPin("");
    setOperatorError(null);
    setIsOperatorDialogOpen(true);
  }

  function handleAddOperator() {
    if (!operatorName.trim()) {
      return;
    }

    if (!/^\d{4}$/.test(operatorPin)) {
      setOperatorError("O PIN deve ter exatamente 4 dígitos.");

      return;
    }

    addOperator.mutate(
      { name: operatorName, pin: operatorPin },
      {
        onSuccess: () => setIsOperatorDialogOpen(false),
      },
    );
  }

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

  function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
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
    <section className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4">
        <Header title="Configurações" description="Dados do estabelecimento usados no sistema e na comanda." />
      </div>

      <Separator className="h-px w-full" />

      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
        <div className="mb-6 flex max-w-lg items-center justify-between rounded-lg border border-input px-3 py-2">
          <div>
            <p className="text-sm font-medium">Tema escuro</p>
            <p className="text-xs text-muted-foreground">Alterna a aparência do sistema entre claro e escuro.</p>
          </div>

          <ThemeToggle />
        </div>

        <form className="flex max-w-lg flex-col gap-4" onSubmit={handleSubmit(handleSubmitSettings)}>
          <Controller
            control={control}
            name="logoUrl"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Logo</label>

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload />
                    {field.value ? "Trocar logo" : "Adicionar logo"}
                  </Button>

                  {field.value && (
                    <>
                      <Image
                        src={field.value}
                        alt=""
                        className="h-12 w-12 rounded-md object-cover ring-1 ring-foreground/10"
                        width={48}
                        height={48}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          field.onChange(null);

                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }

                          if (settings) {
                            updateSettings.mutate({ ...settings, logoUrl: null });
                          }
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) {
                        return;
                      }

                      const reader = new FileReader();

                      reader.onload = () => field.onChange(typeof reader.result === "string" ? reader.result : null);
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>
            )}
          />

          <Controller
            control={control}
            name="pixQrCodeUrl"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">QR Code Pix</label>
                <p className="text-xs text-muted-foreground">
                  Exibido na tela de pagamento quando a forma de pagamento Pix for selecionada.
                </p>

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => pixQrInputRef.current?.click()}>
                    <Upload />
                    {field.value ? "Trocar QR Code" : "Adicionar QR Code"}
                  </Button>

                  {field.value && (
                    <>
                      <Image
                        src={field.value}
                        alt=""
                        className="h-12 w-12 rounded-md object-contain ring-1 ring-foreground/10"
                        width={48}
                        height={48}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          field.onChange(null);

                          if (pixQrInputRef.current) {
                            pixQrInputRef.current.value = "";
                          }

                          if (settings) {
                            updateSettings.mutate({ ...settings, pixQrCodeUrl: null });
                          }
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}

                  <input
                    ref={pixQrInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) {
                        return;
                      }

                      const reader = new FileReader();

                      reader.onload = () => field.onChange(typeof reader.result === "string" ? reader.result : null);
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>
            )}
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nome do estabelecimento</label>
            <Input placeholder="Nome do estabelecimento" {...register("name", { required: true })} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-sm font-medium">CNPJ</label>
              <Input placeholder="00.000.000/0000-00" {...register("cnpj")} />
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input placeholder="(00) 00000-0000" {...register("phone")} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Endereço</label>
            <Textarea placeholder="Rua, número, bairro, cidade - UF" rows={2} {...register("address")} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Mensagem no rodapé da comanda</label>
            <Textarea placeholder="Ex.: Volte sempre! (opcional)" rows={2} {...register("receiptFooterMessage")} />
          </div>

          <div>
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>

            {updateSettings.isSuccess && <span className="ml-3 text-sm text-muted-foreground">Configurações salvas.</span>}
          </div>
        </form>

        <Separator className="my-6 max-w-lg" />

        <div className="max-w-lg space-y-3">
          <div>
            <p className="text-sm font-medium">Operadores</p>
            <p className="text-xs text-muted-foreground">
              Cadastre operadores com PIN pra exigir login antes de usar o sistema. Sem operadores cadastrados, o login fica
              desativado.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {settings?.operators.map((operator) => (
              <Card key={operator.id} className="flex flex-row items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{toTitleCase(operator.name)}</span>
                </div>

                <Button
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => deleteOperator.mutate(operator.id)}
                  disabled={deleteOperator.isPending}
                >
                  <Trash2 />
                </Button>
              </Card>
            ))}

            {settings?.operators.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum operador cadastrado.</p>
            )}
          </div>

          <Button type="button" variant="outline" onClick={handleOpenOperatorDialog}>
            Adicionar operador
          </Button>
        </div>

        <Separator className="my-6 max-w-lg" />

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
      </div>

      <Dialog open={isOperatorDialogOpen} onOpenChange={setIsOperatorDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo operador</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Input
              placeholder="Nome do operador"
              value={operatorName}
              onChange={(e) => {
                setOperatorName(e.target.value);
                setOperatorError(null);
              }}
            />

            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="PIN de 4 dígitos"
              value={operatorPin}
              onChange={(e) => {
                setOperatorPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                setOperatorError(null);
              }}
            />

            {operatorError && <p className="text-xs text-destructive">{operatorError}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleAddOperator} disabled={addOperator.isPending || !operatorName.trim()}>
              {addOperator.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
