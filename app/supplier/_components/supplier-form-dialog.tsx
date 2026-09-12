"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { ReactNode } from "react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
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

interface TSupplierFormValues {
  companyName: string;
  whatsapp: string;
  suppliesDescription: string;
  paymentTerms: string;
  deliveryDays: string[];
  deliveryPeriod: string;
}

interface TSupplierFormDialog {
  trigger: ReactNode;
  /** Quando informado, o dialog edita esse fornecedor em vez de criar um novo. */
  supplier?: TSupplier;
}

function buildDefaultValues(supplier?: TSupplier): TSupplierFormValues {
  return {
    companyName: supplier?.companyName ?? "",
    whatsapp: supplier?.whatsapp ?? "",
    suppliesDescription: supplier?.suppliesDescription ?? "",
    paymentTerms: supplier?.paymentTerms ?? "",
    deliveryDays: supplier?.deliveryDays ?? [],
    deliveryPeriod: supplier?.deliveryPeriod ?? "",
  };
}

export function SupplierFormDialog({ trigger, supplier }: TSupplierFormDialog) {
  const isEditing = Boolean(supplier);

  const [open, setOpen] = useState(false);

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const { register, handleSubmit, control, reset } = useForm<TSupplierFormValues>({
    defaultValues: buildDefaultValues(supplier),
  });

  const isPending = createSupplier.isPending || updateSupplier.isPending;

  function handleSubmitSupplier(data: TSupplierFormValues) {
    const payload = {
      companyName: data.companyName,
      whatsapp: data.whatsapp || null,
      suppliesDescription: data.suppliesDescription || null,
      paymentTerms: data.paymentTerms || null,
      deliveryDays: data.deliveryDays as Weekday[],
      deliveryPeriod: (data.deliveryPeriod || null) as DeliveryPeriod | null,
    };

    if (supplier) {
      updateSupplier.mutate({ id: supplier.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      createSupplier.mutate(payload, { onSuccess: () => setOpen(false) });
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

        <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleSubmitSupplier)}>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Empresa</label>
            <Input placeholder="Nome da empresa" {...register("companyName", { required: true })} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">WhatsApp</label>
            <Input placeholder="Ex.: (22) 99999-9999" {...register("whatsapp")} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">O que fornece</label>
            <Input placeholder="Ex.: Café em grãos, leite, copos" {...register("suppliesDescription")} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Condição de pagamento</label>
            <Input placeholder="Ex.: 30 dias, à vista" {...register("paymentTerms")} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Dias de entrega</label>
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
            <label className="text-sm font-medium">Horário de entrega</label>
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

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar fornecedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
