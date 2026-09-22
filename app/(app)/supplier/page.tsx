"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/_components/ui/table";
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

  const filteredSuppliers = suppliers?.filter((supplier) =>
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  function handleDeleteSupplier(supplierId: number) {
    deleteSupplier.mutate(supplierId, { onSuccess: () => toast.success("Fornecedor excluído com sucesso!") });
  }

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
              placeholder="Filtrar por nome do fornecedor..."
              className="mb-4 max-w-100"
            />

            {filteredSuppliers?.length === 0 ? (
              <EmptyState message="Nenhum fornecedor encontrado com esse nome." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Fornece</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredSuppliers?.map((supplier: TSupplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <p className="font-medium whitespace-normal">{toTitleCase(supplier.companyName)}</p>
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground">{supplier.observation || "—"}</TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground">
                        {supplier.suppliesDescription || "—"}
                      </TableCell>

                      <TableCell>
                        {supplier.whatsapp ? (
                          <Link href={buildWhatsappLink(supplier.whatsapp)} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" type="button">
                              <MessageCircle />
                              {supplier.whatsapp}
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
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
                      </TableCell>

                      <TableCell className="text-muted-foreground">
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
                      </TableCell>

                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </div>
    </section>
  );
}
