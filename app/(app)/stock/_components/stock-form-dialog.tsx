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

import { useCreateSupplyItem } from "../mutation/useCreateSupplyItem";
import { useUpdateSupplyItem } from "../mutation/useUpdateSupplyItem";
import type { TSupplier, TSupplyItem } from "../../order/interface";
import { formatUnit, SUPPLY_UNITS, type SupplyUnit } from "@/_lib/supply-units";
import { toTitleCase } from "@/_lib/to-title-case";

const stockFormSchema = z.object({
  name: z.string().trim().min(1, "Campo obrigatório."),
  brand: z.string(),
  quantity: z.string(),
  unit: z.string().min(1, "Campo obrigatório."),
  minQuantity: z.string(),
  costPrice: z.string(),
  supplierId: z.number(),
  expiresAt: z.string(),
});

type TStockFormValues = z.infer<typeof stockFormSchema>;

interface TStockFormDialog {
  suppliers: TSupplier[] | undefined;
  trigger: ReactNode;
  supplyItem?: TSupplyItem;
}

function buildDefaultValues(supplyItem?: TSupplyItem): TStockFormValues {
  return {
    name: supplyItem?.name ?? "",
    brand: supplyItem?.brand ?? "",
    quantity: supplyItem ? String(supplyItem.quantity) : "",
    unit: supplyItem?.unit ?? SUPPLY_UNITS[0],
    minQuantity: supplyItem ? String(supplyItem.minQuantity) : "",
    costPrice: supplyItem ? String(supplyItem.costPrice) : "",
    supplierId: supplyItem?.supplierId ?? 0,
    expiresAt: supplyItem?.expiresAt ?? "",
  };
}

export function StockFormDialog({ suppliers, trigger, supplyItem }: TStockFormDialog) {
  const isEditing = Boolean(supplyItem);
  const nameId = useId();
  const brandId = useId();
  const quantityId = useId();
  const unitId = useId();
  const minQuantityId = useId();
  const costPriceId = useId();
  const supplierId = useId();
  const expiresAtId = useId();

  const [open, setOpen] = useState(false);

  const createSupplyItem = useCreateSupplyItem();
  const updateSupplyItem = useUpdateSupplyItem();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TStockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: buildDefaultValues(supplyItem),
  });

  const isPending = createSupplyItem.isPending || updateSupplyItem.isPending;

  function handleSubmitSupplyItem(data: TStockFormValues) {
    const payload = {
      name: data.name,
      brand: data.brand || null,
      quantity: Number(data.quantity) || 0,
      unit: data.unit as SupplyUnit,
      minQuantity: Number(data.minQuantity) || 0,
      costPrice: Number(data.costPrice) || 0,
      supplierId: data.supplierId || null,
      expiresAt: data.expiresAt || null,
    };

    if (supplyItem) {
      updateSupplyItem.mutate(
        { id: supplyItem.id, ...payload },
        {
          onSuccess: () => {
            setOpen(false);
            toast.success("Insumo atualizado com sucesso!");
          },
        },
      );
    } else {
      createSupplyItem.mutate(payload, {
        onSuccess: () => {
          setOpen(false);
          toast.success("Insumo adicionado com sucesso!");
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
          reset(buildDefaultValues(supplyItem));
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar insumo" : "Novo insumo"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do insumo." : "Preencha os dados do novo insumo em estoque."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleSubmitSupplyItem)} noValidate>
          <div className="flex flex-col gap-1">
            <Label htmlFor={nameId}>Nome</Label>
            <Input
              id={nameId}
              autoComplete="off"
              placeholder="Ex.: Mussarela"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={brandId}>Marca</Label>
            <Input id={brandId} autoComplete="off" placeholder="Opcional" {...register("brand")} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={quantityId}>Quantidade em estoque</Label>
              <Input
                id={quantityId}
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex.: 1250"
                title="Se o insumo é medido em gramas, já digite o total (ex.: 5 pacotes de 250g = 1250)"
                {...register("quantity")}
              />
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={unitId}>Unidade de medida</Label>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={unitId} className="w-full" aria-invalid={Boolean(errors.unit)}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLY_UNITS.map((unitOption) => (
                        <SelectItem key={unitOption} value={unitOption}>
                          {formatUnit(unitOption)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={minQuantityId}>Estoque mínimo (alerta)</Label>
            <Input
              id={minQuantityId}
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex.: 500"
              title="Alertar quando o estoque ficar menor ou igual a esse valor"
              {...register("minQuantity")}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={costPriceId}>Valor total pago</Label>
            <Input
              id={costPriceId}
              type="number"
              step="0.01"
              min="0"
              placeholder="Quanto custou essa compra toda"
              title="Valor total pago por essa quantidade, não o preço por unidade"
              {...register("costPrice")}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={supplierId}>Fornecedor</Label>
            <Controller
              control={control}
              name="supplierId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger id={supplierId} className="w-full">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nenhum</SelectItem>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {toTitleCase(supplier.companyName)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={expiresAtId}>Validade</Label>
            <Input id={expiresAtId} type="date" placeholder="Opcional" {...register("expiresAt")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar insumo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
