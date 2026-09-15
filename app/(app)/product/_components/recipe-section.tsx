import { Controller, useWatch, type Control, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import type { FieldArrayWithId } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import { toTitleCase } from "@/_lib/to-title-case";
import { formatCurrency } from "@/_lib/format-currency";
import { getSupplyUnitCost } from "@/_lib/recipe-cost";
import { convertQuantity, formatUnit, getCompatibleUnits } from "@/_lib/supply-units";

import type { TSupplyItem } from "../../order/interface";
import type { TProductFormValues } from "./product-form-dialog";

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

interface TRecipeSection {
  control: Control<TProductFormValues>;
  register: UseFormRegister<TProductFormValues>;
  setValue: UseFormSetValue<TProductFormValues>;
  supplyItems: TSupplyItem[] | undefined;
  recipeFields: FieldArrayWithId<TProductFormValues, "recipe", "id">[];
  onAppendItem: () => void;
  onRemoveItem: (index: number) => void;
  hasRecipe: boolean;
  calculatedCost: number | null;
  maxProducible: number | null;
}

export function RecipeSection({
  control,
  register,
  setValue,
  supplyItems,
  recipeFields,
  onAppendItem,
  onRemoveItem,
  hasRecipe,
  calculatedCost,
  maxProducible,
}: TRecipeSection) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-input p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Ficha técnica</p>
          <p className="text-xs text-muted-foreground">Insumos usados nesse produto. Calcula o CMV automaticamente.</p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onAppendItem}>
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
              onRemove={() => onRemoveItem(index)}
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
  );
}
