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
import { Link2, MessageCircle, Pencil, Plus } from "lucide-react";

import { useGetSuppliers } from "./query/useGetSuppliers";
import { useDeleteSupplier } from "./mutation/useDeleteSupplier";
import { SupplierFormDialog } from "./_components/supplier-form-dialog";
import type { TSupplier } from "../order/interface";
import { buildWhatsappLink } from "@/_lib/whatsapp-link";
import { WEEKDAY_FULL_NAMES } from "@/_lib/delivery-schedule";
import { toTitleCase } from "@/_lib/to-title-case";
import { shortenUrl } from "@/_lib/shorten-url";
import { useHydratedData } from "@/_lib/use-is-hydrated";
import Link from "next/link";

export default function SupplierPage() {
  const { data: suppliersData } = useGetSuppliers();
  const suppliers = useHydratedData(suppliersData);
  const deleteSupplier = useDeleteSupplier();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSuppliers = suppliers?.filter((supplier) => {
    const term = searchTerm.toLowerCase();
    return (
      supplier.companyName.toLowerCase().includes(term) ||
      (supplier.suppliesDescription?.toLowerCase().includes(term) ?? false)
    );
  });

  const handleDeleteSupplier = useCallback(
    (supplierId: number) => {
      deleteSupplier.mutate(supplierId, { onSuccess: () => toast.success("Fornecedor excluído com sucesso!") });
    },
    [deleteSupplier],
  );

  const columns = useMemo<ColumnDef<TSupplier>[]>(
    () => [
      {
        accessorKey: "companyName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Empresa" />,
        cell: ({ row }) => <p className="font-medium whitespace-normal">{toTitleCase(row.original.companyName)}</p>,
      },
      {
        accessorKey: "observation",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Observações" />,
        cell: ({ row }) => (
          <span className="max-w-48 truncate text-muted-foreground">{row.original.observation || "—"}</span>
        ),
      },
      {
        accessorKey: "suppliesDescription",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fornece" />,
        cell: ({ row }) => (
          <span className="max-w-48 truncate text-muted-foreground">{row.original.suppliesDescription || "—"}</span>
        ),
      },
      {
        accessorKey: "whatsapp",
        header: ({ column }) => <DataTableColumnHeader column={column} title="WhatsApp" />,
        cell: ({ row }) => {
          const supplier = row.original;

          return supplier.whatsapp ? (
            <Link href={buildWhatsappLink(supplier.whatsapp)} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" type="button">
                <MessageCircle />
                {supplier.whatsapp}
              </Button>
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "purchaseLink",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Link" />,
        cell: ({ row }) => {
          const supplier = row.original;

          return (
            <span className="text-muted-foreground">
              {supplier.purchaseLink ? (
                <Link
                  href={supplier.purchaseLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline"
                >
                  <Link2 size={14} />
                  {shortenUrl(supplier.purchaseLink)}
                </Link>
              ) : (
                "—"
              )}
            </span>
          );
        },
      },
      {
        id: "delivery",
        accessorFn: (supplier) =>
          supplier.deliveryDays
            ?.map((day) => WEEKDAY_FULL_NAMES[day as keyof typeof WEEKDAY_FULL_NAMES] ?? day)
            .join(", ") ?? "",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Entrega" />,
        cell: ({ row }) => {
          const supplier = row.original;

          return (
            <span className="text-muted-foreground">
              {supplier.deliveryDays?.length > 0 || supplier.deliveryPeriod ? (
                <div className="flex flex-col">
                  {supplier.deliveryDays?.length > 0 && (
                    <span>
                      {supplier.deliveryDays
                        .map((day) => WEEKDAY_FULL_NAMES[day as keyof typeof WEEKDAY_FULL_NAMES] ?? day)
                        .join(", ")}
                    </span>
                  )}
                  {supplier.deliveryPeriod && <span className="text-xs">{supplier.deliveryPeriod}</span>}
                </div>
              ) : (
                "—"
              )}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Ações</div>,
        cell: ({ row }) => {
          const supplier = row.original;

          return (
            <div className="text-right">
              <RowActions
                editTrigger={
                  <SupplierFormDialog
                    supplier={supplier}
                    trigger={
                      <Button variant="outline" size="icon-sm">
                        <Pencil />
                      </Button>
                    }
                  />
                }
                onDelete={() => handleDeleteSupplier(supplier.id)}
                deleteConfirmTitle={`Excluir "${toTitleCase(supplier.companyName)}"?`}
              />
            </div>
          );
        },
      },
    ],
    [handleDeleteSupplier],
  );

  return (
    <section className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 flex-wrap gap-2">
        <Header title="Fornecedores" />

        <SupplierFormDialog
          trigger={
            <Button size="lg">
              <Plus />
              Adicionar fornecedor
            </Button>
          }
        />
      </div>

      <Separator className="h-px w-full" />

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {suppliers?.length === 0 ? (
          <EmptyState message="Nenhum fornecedor cadastrado." />
        ) : (
          <>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Filtrar por nome ou o que fornece..."
              className="mb-4 max-w-100"
            />

            {filteredSuppliers?.length === 0 ? (
              <EmptyState message="Nenhum fornecedor encontrado com esse nome." />
            ) : (
              <DataTable columns={columns} data={filteredSuppliers ?? []} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
