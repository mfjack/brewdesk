"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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

import { useCreateSupplyItem } from "../mutation/useCreateSupplyItem";
import { useUpdateSupplyItem } from "../mutation/useUpdateSupplyItem";
import type { TSupplier, TSupplyItem } from "../../order/interface";
import { formatUnit, SUPPLY_UNITS } from "@/_lib/supply-units";
import { toTitleCase } from "@/_lib/to-title-case";

interface TStockFormValues {
  name: string;
  brand: string;
  quantity: string;
  unit: string;
  minQuantity: string;
  costPrice: string;
  supplierId: number;
  expiresAt: string;
}

interface TStockFormDialog {
  suppliers: TSupplier[] | undefined;
  trigger: ReactNode;
  /** Quando informado, o dialog edita esse insumo em vez de criar um novo. */
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

  const [open, setOpen] = useState(false);

  const createSupplyItem = useCreateSupplyItem();
  const updateSupplyItem = useUpdateSupplyItem();

  const { register, handleSubmit, control, reset } = useForm<TStockFormValues>({
    defaultValues: buildDefaultValues(supplyItem),
  });

  const isPending = createSupplyItem.isPending || updateSupplyItem.isPending;

  const unit = useWatch({ control, name: "unit" });

  function handleSubmitSupplyItem(data: TStockFormValues) {
    const payload = {
      name: data.name,
      brand: data.brand || null,
      quantity: Number(data.quantity) || 0,
      unit: data.unit,
      minQuantity: Number(data.minQuantity) || 0,
      costPrice: Number(data.costPrice) || 0,
      supplierId: data.supplierId || null,
      expiresAt: data.expiresAt || null,
    };

    if (supplyItem) {
      updateSupplyItem.mutate({ id: supplyItem.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      createSupplyItem.mutate(payload, { onSuccess: () => setOpen(false) });
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

        <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleSubmitSupplyItem)}>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nome</label>
            <Input placeholder="Ex.: Mussarela" {...register("name", { required: true })} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Marca</label>
            <Input placeholder="Opcional" {...register("brand")} />
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium">Quantidade em estoque</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex.: 1250"
                title="Já no total: se comprou 5 pacotes de 250g, digite 1250"
                {...register("quantity")}
              />
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium">Unidade de medida</label>
              <Controller
                control={control}
                name="unit"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
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
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium">Estoque mínimo (alerta)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex.: 500"
                title={`Alertar quando o estoque (em ${formatUnit(unit)}) ficar menor ou igual a esse valor`}
                {...register("minQuantity")}
              />
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium">Valor total pago</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Quanto custou essa compra toda"
                title="Valor total pago por essa quantidade, não o preço por unidade"
                {...register("costPrice")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Fornecedor</label>
            <Controller
              control={control}
              name="supplierId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger className="w-full">
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
            <label className="text-sm font-medium">Validade</label>
            <Input type="date" placeholder="Opcional" {...register("expiresAt")} />
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
