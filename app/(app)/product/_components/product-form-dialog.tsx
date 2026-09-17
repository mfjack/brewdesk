"use client";

import { useId, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ReactNode } from "react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
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
import type { TCategory, TProduct, TRecipeItem, TSupplyItem } from "../../order/interface";
import { toTitleCase } from "@/_lib/to-title-case";
import { formatCurrency } from "@/_lib/format-currency";
import { getMaxProducibleQuantity, getRecipeCost } from "@/_lib/recipe-cost";
import type { SupplyUnit } from "@/_lib/supply-units";

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Campo obrigatório."),
  description: z.string(),
  photoUrl: z.string().nullable(),
  price: z.string().trim().min(1, "Campo obrigatório."),
  costPrice: z.string(),
  quantity: z.string(),
  lowStockThreshold: z.string(),
  categoryId: z.number().min(1, "Campo obrigatório."),
  trackStock: z.boolean(),
  recipe: z.array(
    z.object({
      supplyItemId: z.number(),
      quantity: z.string(),
      unit: z.string(),
    }),
  ),
});

export type TProductFormValues = z.infer<typeof productFormSchema>;
type TRecipeRowFormValues = TProductFormValues["recipe"][number];

interface TProductFormDialog {
  categories: TCategory[] | undefined;
  supplyItems?: TSupplyItem[];
  trigger: ReactNode;
  product?: TProduct;
}

function buildManualCostPriceInput(product: TProduct): string {
  if (product.trackStock && product.quantity > 0) {
    return String(product.costPrice * product.quantity);
  }

  return String(product.costPrice);
}

function buildDefaultValues(product: TProduct | undefined): TProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    photoUrl: product?.photoUrl ?? null,
    price: product ? String(product.price) : "",
    costPrice: product ? buildManualCostPriceInput(product) : "",
    quantity: product ? String(product.quantity) : "",
    lowStockThreshold: product ? String(product.lowStockThreshold) : "",
    categoryId: product?.category.id ?? 0,
    trackStock: product?.trackStock ?? false,
    recipe:
      product?.recipe.map((item) => ({
        supplyItemId: item.supplyItemId,
        quantity: String(item.quantity),
        unit: item.unit,
      })) ?? [],
  };
}

function parseRecipe(recipe: TRecipeRowFormValues[], supplyItems: TSupplyItem[]): TRecipeItem[] {
  return recipe
    .filter((item) => item.supplyItemId > 0 && Number(item.quantity) > 0)
    .map((item) => {
      const supplyItem = supplyItems.find((supply) => supply.id === item.supplyItemId);
      const unit = supplyItem?.unit ?? (item.unit as SupplyUnit);

      return {
        supplyItemId: item.supplyItemId,
        quantity: Number(item.quantity),
        unit,
      };
    });
}

export function ProductFormDialog({ categories, supplyItems, trigger, product }: TProductFormDialog) {
  const isEditing = Boolean(product);
  const nameId = useId();
  const descriptionId = useId();
  const priceId = useId();
  const costPriceId = useId();
  const categoryId = useId();
  const quantityId = useId();
  const lowStockThresholdId = useId();

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
    resolver: zodResolver(productFormSchema),
    defaultValues: buildDefaultValues(product),
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
    reset(buildDefaultValues(product));
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
    const manualBatchCost = Number(data.costPrice) || 0;
    const manualQuantity = data.trackStock ? Number(data.quantity) || 0 : 0;
    const manualUnitCost = manualQuantity > 0 ? manualBatchCost / manualQuantity : manualBatchCost;
    const costPrice = recipe.length > 0 ? getRecipeCost(recipe, supplyItems ?? []) : manualUnitCost;

    const payload = {
      name: data.name,
      description: data.description || null,
      photoUrl: data.photoUrl,
      price: Number(data.price) || 0,
      costPrice,
      quantity: data.trackStock ? Number(data.quantity) || 0 : 0,
      trackStock: data.trackStock,
      lowStockThreshold: data.trackStock || recipe.length > 0 ? Number(data.lowStockThreshold) || 5 : 0,
      category,
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

        <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleSubmitProduct)} noValidate>
          <div className="flex flex-col gap-1">
            <Label htmlFor={nameId}>Nome do produto</Label>
            <Input id={nameId} autoComplete="off" aria-invalid={Boolean(errors.name)} {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={descriptionId}>Descrição</Label>
            <Textarea id={descriptionId} placeholder="Opcional" rows={3} {...register("description")} />
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={priceId}>Preço de venda</Label>
              <Input
                id={priceId}
                type="number"
                step="0.01"
                min="0"
                placeholder="Quanto o cliente paga"
                aria-invalid={Boolean(errors.price)}
                {...register("price")}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={costPriceId}>Preço de custo</Label>
              {hasRecipe ? (
                <div
                  id={costPriceId}
                  className="flex h-10 items-center rounded-lg border border-input bg-input/30 px-2.5 text-sm"
                  title="Calculado pela ficha técnica"
                >
                  {formatCurrency(calculatedCost ?? 0)}
                </div>
              ) : (
                <Input
                  id={costPriceId}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Quanto custou pra fazer todo o lote"
                  title="Custo total pra produzir a quantidade em estoque informada abaixo. Dividido pela quantidade pra calcular o CMV."
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
            <Label htmlFor={categoryId}>Categoria</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value ? String(field.value) : ""} onValueChange={(value) => field.onChange(Number(value))}>
                  <SelectTrigger id={categoryId} className="w-full" aria-invalid={Boolean(errors.categoryId)}>
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
            {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
          </div>

          <SettingRow label="Controlar estoque" description="Diminui automaticamente a cada venda no PDV.">
            <Controller
              control={control}
              name="trackStock"
              render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
            />
          </SettingRow>

          {(trackStock || hasRecipe) && (
            <div className="flex flex-col gap-2 sm:flex-row">
              {trackStock && (
                <div className="flex flex-1 flex-col gap-1">
                  <Label htmlFor={quantityId}>Quantidade em estoque</Label>
                  <Input id={quantityId} type="number" min="0" placeholder="Ex.: 20" {...register("quantity")} />
                </div>
              )}

              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor={lowStockThresholdId}>Alertar com estoque baixo</Label>
                <Input
                  id={lowStockThresholdId}
                  type="number"
                  min="0"
                  placeholder="Ex.: 5"
                  title={
                    hasRecipe && !trackStock
                      ? "Alertar quando der pra fazer só essa quantidade ou menos com o estoque de insumos atual"
                      : "Alertar quando o estoque ficar menor ou igual a esse valor"
                  }
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
