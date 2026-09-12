"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ReactNode } from "react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/_components/ui/dialog";

import { useCreateCategory } from "../mutation/useCreateCategory";
import { useUpdateCategory } from "../mutation/useUpdateCategory";
import type { TCategory } from "../../order/interface";

interface TCategoryFormValues {
  name: string;
}

interface TCategoryFormDialog {
  trigger: ReactNode;
  category?: TCategory;
}

export function CategoryFormDialog({ trigger, category }: TCategoryFormDialog) {
  const isEditing = Boolean(category);

  const [open, setOpen] = useState(false);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const { register, handleSubmit, reset } = useForm<TCategoryFormValues>({
    defaultValues: { name: category?.name ?? "" },
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
          reset({ name: category?.name ?? "" });
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

        <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleSubmitCategory)}>
          <Input placeholder="Nome da categoria" {...register("name", { required: true })} />

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
