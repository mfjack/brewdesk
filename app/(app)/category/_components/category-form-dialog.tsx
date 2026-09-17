"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ReactNode } from "react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/_components/ui/dialog";

import { useCreateCategory } from "../mutation/useCreateCategory";
import { useUpdateCategory } from "../mutation/useUpdateCategory";
import type { TCategory } from "../../order/interface";

const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Campo obrigatório."),
});

type TCategoryFormValues = z.infer<typeof categoryFormSchema>;

interface TCategoryFormDialog {
  trigger: ReactNode;
  category?: TCategory;
}

function buildDefaultValues(category?: TCategory): TCategoryFormValues {
  return { name: category?.name ?? "" };
}

export function CategoryFormDialog({ trigger, category }: TCategoryFormDialog) {
  const isEditing = Boolean(category);
  const nameId = useId();

  const [open, setOpen] = useState(false);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TCategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: buildDefaultValues(category),
  });

  const isPending = createCategory.isPending || updateCategory.isPending;

  function handleSubmitCategory(data: TCategoryFormValues) {
    if (category) {
      updateCategory.mutate({ id: category.id, name: data.name }, { onSuccess: () => setOpen(false) });
    } else {
      createCategory.mutate(data.name, { onSuccess: () => setOpen(false) });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          reset(buildDefaultValues(category));
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize o nome da categoria." : "Digite o nome da nova categoria."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleSubmitCategory)} noValidate>
          <div className="flex flex-col gap-1">
            <Label htmlFor={nameId}>Nome da categoria</Label>
            <Input
              id={nameId}
              autoComplete="off"
              placeholder="Ex.: Bebidas"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
