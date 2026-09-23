"use client";

import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Textarea } from "@/_components/ui/textarea";
import { ImageUploadField } from "@/_components/ui/image-upload-field";

import { useUpdateSettings } from "../mutation/useUpdateSettings";
import type { TStoreSettings } from "../../order/interface";
import { defaultFeatureFlags, defaultTakeoutFee } from "@/_lib/store/settings";
import { formatCnpj, formatPhone } from "@/_lib/masks";
import { useIsMasterOperator } from "@/_lib/operator-session";

const settingsFormSchema = z.object({
  name: z.string().trim().min(1, "Campo obrigatório."),
  cnpj: z.string(),
  phone: z.string(),
  address: z.string(),
  receiptFooterMessage: z.string(),
  logoUrl: z.string().nullable(),
  pixQrCodeUrl: z.string().nullable(),
});

type TSettingsFormValues = z.infer<typeof settingsFormSchema>;

export function GeneralInfoForm({ settings }: { settings: TStoreSettings | undefined }) {
  const updateSettings = useUpdateSettings();
  const isMaster = useIsMasterOperator(settings?.operators);
  const nameId = useId();
  const cnpjId = useId();
  const phoneId = useId();
  const addressId = useId();
  const receiptFooterMessageId = useId();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TSettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
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
    updateSettings.mutate(
      {
        name: data.name,
        cnpj: data.cnpj || null,
        phone: data.phone || null,
        address: data.address || null,
        logoUrl: data.logoUrl,
        receiptFooterMessage: data.receiptFooterMessage || null,
        operators: settings?.operators ?? [],
        pixQrCodeUrl: data.pixQrCodeUrl,
        featureFlags: settings?.featureFlags ?? defaultFeatureFlags,
        takeoutFee: settings?.takeoutFee ?? defaultTakeoutFee,
      },
      { onSuccess: () => toast.success("Configurações salvas com sucesso!") },
    );
  }

  return (
    <form className="flex max-w-lg flex-col gap-4" onSubmit={handleSubmit(handleSubmitSettings)} noValidate>
      {!isMaster && <p className="text-xs text-muted-foreground">Apenas o operador master pode editar essas informações.</p>}

      <fieldset disabled={!isMaster} className="flex flex-col gap-4">
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
          <Label htmlFor={nameId}>Nome do estabelecimento</Label>
          <Input
            id={nameId}
            autoComplete="organization"
            placeholder="Nome do estabelecimento"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor={cnpjId}>CNPJ</Label>
            <Controller
              control={control}
              name="cnpj"
              render={({ field }) => (
                <Input
                  id={cnpjId}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="00.000.000/0000-00"
                  value={field.value}
                  onChange={(event) => field.onChange(formatCnpj(event.target.value))}
                />
              )}
            />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor={phoneId}>Telefone</Label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Input
                  id={phoneId}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="00 00000-0000"
                  value={field.value}
                  onChange={(event) => field.onChange(formatPhone(event.target.value))}
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={addressId}>Endereço</Label>
          <Textarea
            id={addressId}
            autoComplete="street-address"
            placeholder="Rua, número, bairro, cidade - UF"
            rows={2}
            {...register("address")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={receiptFooterMessageId}>Mensagem no rodapé da comanda</Label>
          <Textarea
            id={receiptFooterMessageId}
            placeholder="Ex.: Volte sempre! (opcional)"
            rows={2}
            {...register("receiptFooterMessage")}
          />
        </div>

        <div>
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>

          {updateSettings.isSuccess && <span className="ml-3 text-sm text-muted-foreground">Configurações salvas.</span>}
        </div>
      </fieldset>
    </form>
  );
}
