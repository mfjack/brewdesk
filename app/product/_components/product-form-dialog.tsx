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
import type { TCategory, TProduct } from "../../order/interface";
import Image from "next/image";

interface TProductFormValues {
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: number;
}

interface TProductFormDialog {
  categories: TCategory[] | undefined;
  trigger: ReactNode;
  /** Quando informado, o dialog edita esse produto em vez de criar um novo. */
  product?: TProduct;
}

function buildDefaultValues(product?: TProduct): TProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    quantity: product?.quantity ?? 0,
    categoryId: product?.category.id ?? 0,
  };
}

export function ProductFormDialog({ categories, trigger, product }: TProductFormDialog) {
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

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => setPhotoUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
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
      quantity: trackStock ? data.quantity : 0,
      trackStock,
      categoryId: data.categoryId,
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
          <Input placeholder="Nome do produto" {...register("name", { required: true })} />

          <Textarea placeholder="Descrição (opcional)" rows={3} {...register("description")} />

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

          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Preço"
              {...register("price", { required: true, valueAsNumber: true })}
            />

            <Controller
              control={control}
              name="categoryId"
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={String(field.value ?? "")} onValueChange={(value) => field.onChange(Number(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
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
            <Input type="number" min="0" placeholder="Quantidade em estoque" {...register("quantity", { valueAsNumber: true })} />
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
