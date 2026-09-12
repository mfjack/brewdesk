"use client";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/_components/ui/table";
import { EmptyState } from "@/_components/ui/empty-state";
import { RowActions } from "@/_components/ui/row-actions";
import { Pencil, Plus } from "lucide-react";

import { useGetCategories } from "./query/useGetCategories";
import { useDeleteCategory } from "./mutation/useDeleteCategory";
import { CategoryFormDialog } from "./_components/category-form-dialog";
import type { TCategory } from "../order/interface";
import { toTitleCase } from "@/_lib/to-title-case";

export default function CategoryPage() {
  const { data: categories } = useGetCategories();
  const deleteCategory = useDeleteCategory();

  function handleDeleteCategory(categoryId: number) {
    deleteCategory.mutate(categoryId);
  }

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
        {categories?.length === 0 ? (
          <EmptyState message="Nenhuma categoria cadastrada." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {categories?.map((category: TCategory) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{toTitleCase(category.name)}</TableCell>

                  <TableCell className="text-right">
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
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}
