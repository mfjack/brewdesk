"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Upload } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Textarea } from "@/_components/ui/textarea";
import { Switch } from "@/_components/ui/switch";
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

import { useCreateProduct } from "../mutation/useCreateProduct";
import { useUpdateProduct } from "../mutation/useUpdateProduct";
import type { TCategory, TProduct, TSupplier } from "../../order/interface";
import { toTitleCase } from "@/_lib/to-title-case";
import { resizeImage } from "@/_lib/resize-image";
import Image from "next/image";

interface TProductFormValues {
  name: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
  lowStockThreshold: number;
  categoryId: number;
  supplierId: number;
}

interface TProductFormDialog {
  categories: TCategory[] | undefined;
  suppliers?: TSupplier[];
  trigger: ReactNode;
  /** Quando informado, o dialog edita esse produto em vez de criar um novo. */
  product?: TProduct;
}

function buildDefaultValues(product?: TProduct): TProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    costPrice: product?.costPrice ?? 0,
    quantity: product?.quantity ?? 0,
    lowStockThreshold: product?.lowStockThreshold ?? 5,
    categoryId: product?.category.id ?? 0,
    supplierId: product?.supplierId ?? 0,
  };
}

export function ProductFormDialog({ categories, suppliers, trigger, product }: TProductFormDialog) {
  const isEditing = Boolean(product);

  const [open, setOpen] = useState(false);
  const [trackStock, setTrackStock] = useState(product?.trackStock ?? true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(product?.photoUrl ?? null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const { register, handleSubmit, control, reset } = useForm<TProductFormValues>({
    defaultValues: buildDefaultValues(product),
  });

  const isPending = createProduct.isPending || updateProduct.isPending;

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoUrl(await resizeImage(file));
  }

  function syncFormToProduct() {
    reset(buildDefaultValues(product));
    setPhotoUrl(product?.photoUrl ?? null);
    setTrackStock(product?.trackStock ?? false);
    setFileInputKey((key) => key + 1);
  }

  function handleSubmitProduct(data: TProductFormValues) {
    const payload = {
      name: data.name,
      description: data.description || null,
      photoUrl,
      price: data.price,
      costPrice: data.costPrice,
      quantity: trackStock ? data.quantity : 0,
      trackStock,
      lowStockThreshold: trackStock ? data.lowStockThreshold : 0,
      categoryId: data.categoryId,
      supplierId: data.supplierId || null,
    };

    if (product) {
      updateProduct.mutate({ id: product.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      createProduct.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          syncFormToProduct();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do produto." : "Preencha os dados do produto pra adicionar ao cardápio."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleSubmitProduct)}>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nome do produto</label>
            <Input {...register("name", { required: true })} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea placeholder="Opcional" rows={3} {...register("description")} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Foto</label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload />
                {photoUrl ? "Trocar foto" : "Adicionar foto"}
              </Button>

              {photoUrl && (
                <Image
                  src={photoUrl}
                  alt=""
                  className="h-12 w-12 rounded-md object-cover ring-1 ring-foreground/10"
                  width={48}
                  height={48}
                />
              )}

              <input
                key={fileInputKey}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium">Preço de venda</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Quanto o cliente paga"
                {...register("price", { required: true, valueAsNumber: true })}
              />
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium">Preço de custo</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Quanto custou pra você"
                title="Usado no relatório de CMV e margem"
                {...register("costPrice", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Categoria</label>
            <Controller
              control={control}
              name="categoryId"
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={field.value ? String(field.value) : ""} onValueChange={(value) => field.onChange(Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {toTitleCase(category.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Fornecedor</label>
            <Controller
              control={control}
              name="supplierId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : "0"}
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

          <div className="flex items-center justify-between rounded-lg border border-input px-3 py-2">
            <div>
              <p className="text-sm font-medium">Controlar estoque</p>
              <p className="text-xs text-muted-foreground">Diminui automaticamente a cada venda no PDV.</p>
            </div>

            <Switch checked={trackStock} onCheckedChange={setTrackStock} />
          </div>

          {trackStock && (
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium">Quantidade em estoque</label>
                <Input type="number" min="0" placeholder="0" {...register("quantity", { valueAsNumber: true })} />
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium">Alertar com estoque baixo</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ex.: 5"
                  title="Alertar quando o estoque ficar menor ou igual a esse valor"
                  {...register("lowStockThreshold", { valueAsNumber: true })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
