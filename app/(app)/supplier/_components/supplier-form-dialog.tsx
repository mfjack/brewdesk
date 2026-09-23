"use client";

import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { ReactNode } from "react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Textarea } from "@/_components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/_components/ui/dialog";

import { useCreateSupplier } from "../mutation/useCreateSupplier";
import { useUpdateSupplier } from "../mutation/useUpdateSupplier";
import type { TSupplier } from "../../order/interface";
import { DELIVERY_PERIODS, WEEKDAYS, type DeliveryPeriod, type Weekday } from "@/_lib/delivery-schedule";
import { formatPhone } from "@/_lib/masks";

const supplierFormSchema = z.object({
  companyName: z.string().trim().min(1, "Campo obrigatório."),
  whatsapp: z.string(),
  suppliesDescription: z.string(),
  purchaseLink: z.string(),
  deliveryDays: z.array(z.string()),
  deliveryPeriod: z.string(),
  observation: z.string(),
});

type TSupplierFormValues = z.infer<typeof supplierFormSchema>;

interface TSupplierFormDialog {
  trigger: ReactNode;
  supplier?: TSupplier;
}

function buildDefaultValues(supplier?: TSupplier): TSupplierFormValues {
  return {
    companyName: supplier?.companyName ?? "",
    whatsapp: supplier?.whatsapp ?? "",
    suppliesDescription: supplier?.suppliesDescription ?? "",
    purchaseLink: supplier?.purchaseLink ?? "",
    deliveryDays: supplier?.deliveryDays ?? [],
    deliveryPeriod: supplier?.deliveryPeriod ?? "",
    observation: supplier?.observation ?? "",
  };
}

export function SupplierFormDialog({ trigger, supplier }: TSupplierFormDialog) {
  const isEditing = Boolean(supplier);
  const companyNameId = useId();
  const whatsappId = useId();
  const suppliesDescriptionId = useId();
  const purchaseLinkId = useId();
  const observationId = useId();

  const [open, setOpen] = useState(false);

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TSupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: buildDefaultValues(supplier),
  });

  const isPending = createSupplier.isPending || updateSupplier.isPending;

  function handleSubmitSupplier(data: TSupplierFormValues) {
    const payload = {
      companyName: data.companyName,
      whatsapp: data.whatsapp || null,
      suppliesDescription: data.suppliesDescription || null,
      purchaseLink: data.purchaseLink || null,
      deliveryDays: data.deliveryDays as Weekday[],
      deliveryPeriod: (data.deliveryPeriod || null) as DeliveryPeriod | null,
      observation: data.observation || null,
    };

    if (supplier) {
      updateSupplier.mutate(
        { id: supplier.id, ...payload },
        {
          onSuccess: () => {
            setOpen(false);
            toast.success("Fornecedor atualizado com sucesso!");
          },
        },
      );
    } else {
      createSupplier.mutate(payload, {
        onSuccess: () => {
          setOpen(false);
          toast.success("Fornecedor adicionado com sucesso!");
        },
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          reset(buildDefaultValues(supplier));
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do fornecedor." : "Preencha os dados do novo fornecedor."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleSubmitSupplier)} noValidate>
          <div className="flex flex-col gap-1">
            <Label htmlFor={companyNameId}>Empresa</Label>
            <Input
              id={companyNameId}
              autoComplete="off"
              placeholder="Nome da empresa"
              aria-invalid={Boolean(errors.companyName)}
              {...register("companyName")}
            />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={whatsappId}>WhatsApp</Label>
            <Controller
              control={control}
              name="whatsapp"
              render={({ field }) => (
                <Input
                  id={whatsappId}
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="Ex.: 22 99999-9999"
                  value={field.value}
                  onChange={(event) => field.onChange(formatPhone(event.target.value))}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={suppliesDescriptionId}>O que fornece</Label>
            <Input
              id={suppliesDescriptionId}
              autoComplete="off"
              placeholder="Ex.: Café em grãos, leite, copos"
              {...register("suppliesDescription")}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={purchaseLinkId}>Link de compra</Label>
            <Input
              id={purchaseLinkId}
              type="url"
              autoComplete="off"
              placeholder="Ex.: link do produto no Mercado Livre"
              {...register("purchaseLink")}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Dias de entrega</Label>
            <Controller
              control={control}
              name="deliveryDays"
              render={({ field }) => (
                <div className="flex flex-wrap gap-1">
                  {WEEKDAYS.map((day) => {
                    const isSelected = field.value.includes(day);

                    return (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        aria-pressed={isSelected}
                        onClick={() =>
                          field.onChange(
                            isSelected ? field.value.filter((item) => item !== day) : [...field.value, day],
                          )
                        }
                      >
                        {day}
                      </Button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Horário de entrega</Label>
            <Controller
              control={control}
              name="deliveryPeriod"
              render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Não definido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não definido</SelectItem>
                    {DELIVERY_PERIODS.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={observationId}>Observações</Label>
            <Textarea
              id={observationId}
              placeholder="Ex.: prefere contato por telefone, pedido mínimo de R$ 200"
              rows={3}
              {...register("observation")}
            />
          </div>

          <DialogFooter className="flex-row gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>

            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar fornecedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
