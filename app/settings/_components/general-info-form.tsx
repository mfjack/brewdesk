"use client";

import { Controller, useForm } from "react-hook-form";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Textarea } from "@/_components/ui/textarea";
import { ImageUploadField } from "@/_components/ui/image-upload-field";

import { useUpdateSettings } from "../mutation/useUpdateSettings";
import type { TStoreSettings } from "../../order/interface";

interface TSettingsFormValues {
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  receiptFooterMessage: string;
  logoUrl: string | null;
  pixQrCodeUrl: string | null;
}

export function GeneralInfoForm({ settings }: { settings: TStoreSettings | undefined }) {
  const updateSettings = useUpdateSettings();

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

  return (
    <form className="flex max-w-lg flex-col gap-4" onSubmit={handleSubmit(handleSubmitSettings)}>
      <Controller
        control={control}
        name="logoUrl"
        render={({ field }) => (
          <ImageUploadField
            label="Logo"
            addLabel="Adicionar logo"
            changeLabel="Trocar logo"
            value={field.value}
            onChange={field.onChange}
            onRemove={() => settings && updateSettings.mutate({ ...settings, logoUrl: null })}
          />
        )}
      />

      <Controller
        control={control}
        name="pixQrCodeUrl"
        render={({ field }) => (
          <ImageUploadField
            label="QR Code Pix"
            description="Exibido na tela de pagamento quando a forma de pagamento Pix for selecionada."
            addLabel="Adicionar QR Code"
            changeLabel="Trocar QR Code"
            value={field.value}
            onChange={field.onChange}
            onRemove={() => settings && updateSettings.mutate({ ...settings, pixQrCodeUrl: null })}
            resizeMaxDimension={600}
            resizeMimeType="image/png"
            imageClassName="h-12 w-12 rounded-md object-contain ring-1 ring-foreground/10"
          />
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
  );
}
