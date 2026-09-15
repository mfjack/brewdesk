"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { ImageUploadField } from "@/_components/ui/image-upload-field";
import { SettingRow } from "@/_components/ui/setting-row";
import { RecipeSection } from "./recipe-section";

import { useCreateProduct } from "../mutation/useCreateProduct";
import { useUpdateProduct } from "../mutation/useUpdateProduct";
import type { TCategory, TProduct, TRecipeItem, TSupplier, TSupplyItem } from "../../order/interface";
import { toTitleCase } from "@/_lib/to-title-case";
import { formatCurrency } from "@/_lib/format-currency";
import { getMaxProducibleQuantity, getRecipeCost } from "@/_lib/recipe-cost";
import { convertQuantity, type SupplyUnit } from "@/_lib/supply-units";

interface TRecipeRowFormValues {
  supplyItemId: number;
  quantity: string;
  unit: string;
}

export interface TProductFormValues {
  name: string;
  description: string;
  photoUrl: string | null;
  price: string;
  costPrice: string;
  quantity: string;
  lowStockThreshold: string;
  categoryId: number;
  supplierId: number;
  trackStock: boolean;
  recipe: TRecipeRowFormValues[];
}

interface TProductFormDialog {
  categories: TCategory[] | undefined;
  suppliers?: TSupplier[];
  supplyItems?: TSupplyItem[];
  trigger: ReactNode;
  product?: TProduct;
}

function buildDefaultValues(product: TProduct | undefined, supplyItems: TSupplyItem[] | undefined): TProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    photoUrl: product?.photoUrl ?? null,
    price: product ? String(product.price) : "",
    costPrice: product ? String(product.costPrice) : "",
    quantity: product ? String(product.quantity) : "",
    lowStockThreshold: product ? String(product.lowStockThreshold) : "",
    categoryId: product?.category.id ?? 0,
    supplierId: product?.supplierId ?? 0,
    trackStock: product?.trackStock ?? false,
    recipe:
      product?.recipe.map((item) => {
        const supplyItem = supplyItems?.find((supply) => supply.id === item.supplyItemId);
        const nativeUnit = supplyItem?.unit ?? item.unit;
        const displayUnit = item.unit || nativeUnit;
        const displayQuantity = convertQuantity(item.quantity, nativeUnit, displayUnit);

        return { supplyItemId: item.supplyItemId, quantity: String(displayQuantity), unit: displayUnit };
      }) ?? [],
  };
}

function parseRecipe(recipe: TRecipeRowFormValues[], supplyItems: TSupplyItem[]): TRecipeItem[] {
  return recipe
    .filter((item) => item.supplyItemId > 0 && Number(item.quantity) > 0)
    .map((item) => {
      const supplyItem = supplyItems.find((supply) => supply.id === item.supplyItemId);
      const nativeUnit = supplyItem?.unit ?? item.unit;
      const unit = item.unit || nativeUnit;

      return {
        supplyItemId: item.supplyItemId,
        quantity: convertQuantity(Number(item.quantity), unit, nativeUnit),
        unit: unit as SupplyUnit,
      };
    });
}

export function ProductFormDialog({ categories, suppliers, supplyItems, trigger, product }: TProductFormDialog) {
  const isEditing = Boolean(product);

  const [open, setOpen] = useState(false);
  const [photoFieldKey, setPhotoFieldKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TProductFormValues>({
    defaultValues: buildDefaultValues(product, supplyItems),
  });

  const {
    fields: recipeFields,
    append: appendRecipeItem,
    remove: removeRecipeItem,
  } = useFieldArray({ control, name: "recipe" });

  const isPending = createProduct.isPending || updateProduct.isPending;

  const watchedRecipe = useWatch({ control, name: "recipe" });
  const trackStock = useWatch({ control, name: "trackStock" });
  const parsedRecipe = parseRecipe(watchedRecipe ?? [], supplyItems ?? []);
  const hasRecipe = parsedRecipe.length > 0;
  const calculatedCost = hasRecipe ? getRecipeCost(parsedRecipe, supplyItems ?? []) : null;
  const maxProducible = hasRecipe ? getMaxProducibleQuantity(parsedRecipe, supplyItems ?? []) : null;

  function syncFormToProduct() {
    reset(buildDefaultValues(product, supplyItems));
    setPhotoFieldKey((key) => key + 1);
    setFormError(null);
  }

  function handleSubmitProduct(data: TProductFormValues) {
    const category = categories?.find((item) => item.id === data.categoryId);

    if (!category) {
      setFormError("Categoria não encontrada. Atualize a página e tente novamente.");

      return;
    }

    setFormError(null);

    const recipe = parseRecipe(data.recipe, supplyItems ?? []);
    const costPrice = recipe.length > 0 ? getRecipeCost(recipe, supplyItems ?? []) : Number(data.costPrice) || 0;

    const payload = {
      name: data.name,
      description: data.description || null,
      photoUrl: data.photoUrl,
      price: Number(data.price) || 0,
      costPrice,
      quantity: data.trackStock ? Number(data.quantity) || 0 : 0,
      trackStock: data.trackStock,
      lowStockThreshold: data.trackStock ? Number(data.lowStockThreshold) || 0 : 0,
      category,
      supplierId: data.supplierId || null,
      recipe,
    };

    const onError = (error: unknown) => setFormError(error instanceof Error ? error.message : "Não foi possível salvar o produto.");

    if (product) {
      updateProduct.mutate({ id: product.id, ...payload }, { onSuccess: () => setOpen(false), onError });
    } else {
      createProduct.mutate(payload, { onSuccess: () => setOpen(false), onError });
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

      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto no-scrollbar">
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
            {errors.name && <p className="text-xs text-destructive">Campo obrigatório.</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea placeholder="Opcional" rows={3} {...register("description")} />
          </div>

          <Controller
            control={control}
            name="photoUrl"
            render={({ field }) => (
              <ImageUploadField
                key={photoFieldKey}
                label="Foto"
                addLabel="Adicionar foto"
                changeLabel="Trocar foto"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium">Preço de venda</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Quanto o cliente paga"
                {...register("price", { required: true })}
              />
              {errors.price && <p className="text-xs text-destructive">Campo obrigatório.</p>}
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium">Preço de custo</label>
              {hasRecipe ? (
                <div
                  className="flex h-10 items-center rounded-lg border border-input bg-input/30 px-2.5 text-sm"
                  title="Calculado pela ficha técnica"
                >
                  {formatCurrency(calculatedCost ?? 0)}
                </div>
              ) : (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Quanto custou pra você"
                  title="Usado no relatório de CMV e margem"
                  {...register("costPrice")}
                />
              )}
            </div>
          </div>

          <RecipeSection
            control={control}
            register={register}
            setValue={setValue}
            supplyItems={supplyItems}
            recipeFields={recipeFields}
            onAppendItem={() => appendRecipeItem({ supplyItemId: 0, quantity: "", unit: "" })}
            onRemoveItem={removeRecipeItem}
            hasRecipe={hasRecipe}
            calculatedCost={calculatedCost}
            maxProducible={maxProducible}
          />

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
            {errors.categoryId && <p className="text-xs text-destructive">Campo obrigatório.</p>}
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

          <SettingRow label="Controlar estoque" description="Diminui automaticamente a cada venda no PDV.">
            <Controller
              control={control}
              name="trackStock"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </SettingRow>

          {trackStock && (
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium">Quantidade em estoque</label>
                <Input type="number" min="0" placeholder="Ex.: 20" {...register("quantity")} />
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <label className="text-sm font-medium">Alertar com estoque baixo</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ex.: 5"
                  title="Alertar quando o estoque ficar menor ou igual a esse valor"
                  {...register("lowStockThreshold")}
                />
              </div>
            </div>
          )}

          {formError && <p className="text-xs text-destructive">{formError}</p>}

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
