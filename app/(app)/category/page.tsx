"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { DataTable } from "@/_components/ui/data-table";
import { DataTableColumnHeader } from "@/_components/ui/data-table-column-header";
import { EmptyState } from "@/_components/ui/empty-state";
import { RowActions } from "@/_components/ui/row-actions";
import { SearchInput } from "@/_components/ui/search-input";
import { Pencil, Plus } from "lucide-react";

import { useGetCategories } from "./query/useGetCategories";
import { useDeleteCategory } from "./mutation/useDeleteCategory";
import { CategoryFormDialog } from "./_components/category-form-dialog";
import type { TCategory } from "../order/interface";
import { formatCurrency } from "@/_lib/format-currency";
import { toTitleCase } from "@/_lib/to-title-case";
import { useHydratedData } from "@/_lib/use-is-hydrated";

export default function CategoryPage() {
  const { data: categoriesData } = useGetCategories();
  const categories = useHydratedData(categoriesData);
  const deleteCategory = useDeleteCategory();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = categories?.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDeleteCategory = useCallback(
    (categoryId: number) => {
      deleteCategory.mutate(categoryId, { onSuccess: () => toast.success("Categoria excluída com sucesso!") });
    },
    [deleteCategory],
  );

  const columns = useMemo<ColumnDef<TCategory>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
        cell: ({ row }) => <span className="font-medium">{toTitleCase(row.original.name)}</span>,
      },
      {
        accessorKey: "price",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Preço" />,
        cell: ({ row }) =>
          row.original.price ? (
            <span>{formatCurrency(row.original.price)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Ações</div>,
        cell: ({ row }) => {
          const category = row.original;

          return (
            <div className="text-right">
              <RowActions
                editTrigger={
                  <CategoryFormDialog
                    category={category}
                    trigger={
                      <Button variant="outline" size="icon-sm">
                        <Pencil />
                      </Button>
                    }
                  />
                }
                onDelete={() => handleDeleteCategory(category.id)}
                isDeleting={deleteCategory.isPending}
                deleteConfirmTitle={`Excluir "${toTitleCase(category.name)}"?`}
              />
            </div>
          );
        },
      },
    ],
    [handleDeleteCategory, deleteCategory.isPending],
  );

  return (
    <section className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 flex-wrap gap-2">
        <Header title="Categorias" />

        <CategoryFormDialog
          trigger={
            <Button size="lg">
              <Plus />
              Adicionar categoria
            </Button>
          }
        />
      </div>

      <Separator className="h-px w-full" />

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {categories === undefined ? (
          <EmptyState message="Carregando categorias..." />
        ) : categories.length === 0 ? (
          <EmptyState
            message="Nenhuma categoria cadastrada."
            action={
              <CategoryFormDialog
                trigger={
                  <Button size="sm">
                    <Plus />
                    Adicionar categoria
                  </Button>
                }
              />
            }
          />
        ) : (
          <>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Filtrar por nome da categoria..."
              className="mb-4 max-w-100"
            />

            {filteredCategories?.length === 0 ? (
              <EmptyState message="Nenhuma categoria encontrada com esse nome." />
            ) : (
              <DataTable columns={columns} data={filteredCategories ?? []} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
