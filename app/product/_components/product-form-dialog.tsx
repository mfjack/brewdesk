"use client";

import { useEffect, useRef, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Plus, Trash2, Upload } from "lucide-react";
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
import type { TCategory, TProduct, TRecipeItem, TSupplier, TSupplyItem } from "../../order/interface";
import { toTitleCase } from "@/_lib/to-title-case";
import { resizeImage } from "@/_lib/resize-image";
import { formatCurrency } from "@/_lib/format-currency";
import { getMaxProducibleQuantity, getRecipeCost, getSupplyUnitCost } from "@/_lib/recipe-cost";
import { convertQuantity, formatUnit, getCompatibleUnits } from "@/_lib/supply-units";
import Image from "next/image";

interface TRecipeRowFormValues {
  supplyItemId: number;
  quantity: string;
  unit: string;
}

interface TProductFormValues {
  name: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
  lowStockThreshold: number;
  categoryId: number;
  supplierId: number;
  recipe: TRecipeRowFormValues[];
}

interface TProductFormDialog {
  categories: TCategory[] | undefined;
  suppliers?: TSupplier[];
  supplyItems?: TSupplyItem[];
  trigger: ReactNode;
  /** Quando informado, o dialog edita esse produto em vez de criar um novo. */
  product?: TProduct;
}

function buildDefaultValues(product: TProduct | undefined, supplyItems: TSupplyItem[] | undefined): TProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    costPrice: product?.costPrice ?? 0,
    quantity: product?.quantity ?? 0,
    lowStockThreshold: product?.lowStockThreshold ?? 5,
    categoryId: product?.category.id ?? 0,
    supplierId: product?.supplierId ?? 0,
    recipe:
      product?.recipe.map((item) => {
        const supplyItem = supplyItems?.find((supply) => supply.id === item.supplyItemId);

        return { supplyItemId: item.supplyItemId, quantity: String(item.quantity), unit: supplyItem?.unit ?? "" };
      }) ?? [],
  };
}

function parseRecipe(recipe: TRecipeRowFormValues[], supplyItems: TSupplyItem[]): TRecipeItem[] {
  return recipe
    .filter((item) => item.supplyItemId > 0 && Number(item.quantity) > 0)
    .map((item) => {
      const supplyItem = supplyItems.find((supply) => supply.id === item.supplyItemId);
      const nativeUnit = supplyItem?.unit ?? item.unit;

      return {
        supplyItemId: item.supplyItemId,
        quantity: convertQuantity(Number(item.quantity), item.unit || nativeUnit, nativeUnit),
      };
    });
}

function RecipeItemRow({
  index,
  control,
  register,
  setValue,
  supplyItems,
  onRemove,
}: {
  index: number;
  control: Control<TProductFormValues>;
  register: UseFormRegister<TProductFormValues>;
  setValue: UseFormSetValue<TProductFormValues>;
  supplyItems: TSupplyItem[] | undefined;
  onRemove: () => void;
}) {
  const supplyItemId = useWatch({ control, name: `recipe.${index}.supplyItemId` });
  const quantity = useWatch({ control, name: `recipe.${index}.quantity` });
  const unit = useWatch({ control, name: `recipe.${index}.unit` });
  const supplyItem = supplyItems?.find((item) => item.id === supplyItemId);
  const compatibleUnits = getCompatibleUnits(supplyItem?.unit ?? "unidade");

  const numericQuantity = Number(quantity) || 0;
  const rowCost =
    supplyItem && numericQuantity > 0
      ? convertQuantity(numericQuantity, unit || supplyItem.unit, supplyItem.unit) * getSupplyUnitCost(supplyItem)
      : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs text-muted-foreground">Insumo</label>
          <Controller
            control={control}
            name={`recipe.${index}.supplyItemId`}
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(value) => {
                  const newSupplyItemId = Number(value);
                  field.onChange(newSupplyItemId);

                  const newSupplyItem = supplyItems?.find((item) => item.id === newSupplyItemId);

                  setValue(`recipe.${index}.unit`, newSupplyItem?.unit ?? "");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {supplyItems?.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {toTitleCase(item.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex w-20 flex-col gap-1">
          <label className="text-xs text-muted-foreground">Qtd.</label>
          <Input type="number" step="0.01" min="0" placeholder="0" {...register(`recipe.${index}.quantity`)} />
        </div>

        <div className="flex w-20 flex-col gap-1">
          <label className="text-xs text-muted-foreground">Unidade</label>
          <Controller
            control={control}
            name={`recipe.${index}.unit`}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {compatibleUnits.map((unitOption) => (
                    <SelectItem key={unitOption} value={unitOption}>
                      {formatUnit(unitOption)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <Button type="button" variant="destructive" size="icon-sm" onClick={onRemove}>
          <Trash2 />
        </Button>
      </div>

      {rowCost > 0 && <p className="text-right text-xs text-muted-foreground">Custo: {formatCurrency(rowCost)}</p>}
    </div>
  );
}

export function ProductFormDialog({ categories, suppliers, supplyItems, trigger, product }: TProductFormDialog) {
  const isEditing = Boolean(product);

  const [open, setOpen] = useState(false);
  const [trackStock, setTrackStock] = useState(product?.trackStock ?? true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(product?.photoUrl ?? null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const { register, handleSubmit, control, reset, setValue } = useForm<TProductFormValues>({
    defaultValues: buildDefaultValues(product, supplyItems),
  });

  const {
    fields: recipeFields,
    append: appendRecipeItem,
    remove: removeRecipeItem,
  } = useFieldArray({ control, name: "recipe" });

  const isPending = createProduct.isPending || updateProduct.isPending;

  const watchedRecipe = useWatch({ control, name: "recipe" });
  const parsedRecipe = parseRecipe(watchedRecipe ?? [], supplyItems ?? []);
  const hasRecipe = parsedRecipe.length > 0;
  const calculatedCost = hasRecipe ? getRecipeCost(parsedRecipe, supplyItems ?? []) : null;
  const maxProducible = hasRecipe ? getMaxProducibleQuantity(parsedRecipe, supplyItems ?? []) : null;

  useEffect(() => {
    if (calculatedCost !== null) {
      setValue("costPrice", Number(calculatedCost.toFixed(2)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedCost]);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoUrl(await resizeImage(file));
  }

  function syncFormToProduct() {
    reset(buildDefaultValues(product, supplyItems));
    setPhotoUrl(product?.photoUrl ?? null);
    setTrackStock(product?.trackStock ?? false);
    setFileInputKey((key) => key + 1);
  }

  function handleSubmitProduct(data: TProductFormValues) {
    const recipe = parseRecipe(data.recipe, supplyItems ?? []);
    const costPrice = recipe.length > 0 ? getRecipeCost(recipe, supplyItems ?? []) : data.costPrice;

    const payload = {
      name: data.name,
      description: data.description || null,
      photoUrl,
      price: data.price,
      costPrice,
      quantity: trackStock ? data.quantity : 0,
      trackStock,
      lowStockThreshold: trackStock ? data.lowStockThreshold : 0,
      categoryId: data.categoryId,
      supplierId: data.supplierId || null,
      recipe,
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

      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
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
                title={hasRecipe ? "Calculado pela ficha técnica" : "Usado no relatório de CMV e margem"}
                disabled={hasRecipe}
                {...register("costPrice", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-input p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Ficha técnica</p>
                <p className="text-xs text-muted-foreground">
                  Insumos usados nesse produto. Calcula o CMV automaticamente.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendRecipeItem({ supplyItemId: 0, quantity: "", unit: "" })}
              >
                <Plus />
                Insumo
              </Button>
            </div>

            {recipeFields.length > 0 && (
              <div className="flex flex-col gap-2">
                {recipeFields.map((field, index) => (
                  <RecipeItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    register={register}
                    setValue={setValue}
                    supplyItems={supplyItems}
                    onRemove={() => removeRecipeItem(index)}
                  />
                ))}
              </div>
            )}

            {hasRecipe && (
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                <span>CMV calculado: {formatCurrency(calculatedCost ?? 0)}</span>
                {maxProducible !== null && <span>Dá pra fazer aprox. {maxProducible} unidade(s) com o estoque atual.</span>}
              </div>
            )}
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
