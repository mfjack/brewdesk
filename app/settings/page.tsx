"use client";

import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Textarea } from "@/_components/ui/textarea";
import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { ThemeToggle } from "@/_components/ui/theme-toggle";

import { useGetSettings } from "./query/useGetSettings";
import { useUpdateSettings } from "./mutation/useUpdateSettings";

interface TSettingsFormValues {
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  receiptFooterMessage: string;
  logoUrl: string | null;
}

export default function SettingsPage() {
  const { data: settings } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, control } = useForm<TSettingsFormValues>({
    defaultValues: { name: "", cnpj: "", phone: "", address: "", receiptFooterMessage: "", logoUrl: null },
    values: settings
      ? {
          name: settings.name,
          cnpj: settings.cnpj ?? "",
          phone: settings.phone ?? "",
          address: settings.address ?? "",
          receiptFooterMessage: settings.receiptFooterMessage ?? "",
          logoUrl: settings.logoUrl,
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
    });
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
      </div>
    </section>
  );
}
