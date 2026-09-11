"use client";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/_components/ui/table";
import { MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";

import { useGetSuppliers } from "./query/useGetSuppliers";
import { useDeleteSupplier } from "./mutation/useDeleteSupplier";
import { SupplierFormDialog } from "./_components/supplier-form-dialog";
import type { TSupplier } from "../order/interface";
import { buildWhatsappLink } from "@/_lib/whatsapp-link";
import { WEEKDAY_FULL_NAMES } from "@/_lib/delivery-schedule";
import { toTitleCase } from "@/_lib/to-title-case";

export default function SupplierPage() {
  const { data: suppliers } = useGetSuppliers();
  const deleteSupplier = useDeleteSupplier();

  function handleDeleteSupplier(supplierId: number) {
    deleteSupplier.mutate(supplierId);
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

      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
        {suppliers?.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Fornece</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {suppliers?.map((supplier: TSupplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <p className="font-medium whitespace-normal">{toTitleCase(supplier.companyName)}</p>
                  </TableCell>

                  <TableCell>
                    {supplier.whatsapp ? (
                      <a href={buildWhatsappLink(supplier.whatsapp)} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" type="button">
                          <MessageCircle />
                          {supplier.whatsapp}
                        </Button>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    {supplier.suppliesDescription || "—"}
                  </TableCell>

                  <TableCell className="text-muted-foreground">{supplier.paymentTerms || "—"}</TableCell>

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
                    <div className="flex justify-end gap-2">
                      <SupplierFormDialog
                        supplier={supplier}
                        trigger={
                          <Button variant="outline" size="icon-sm">
                            <Pencil />
                          </Button>
                        }
                      />

                      <Button variant="destructive" size="icon-sm" onClick={() => handleDeleteSupplier(supplier.id)}>
                        <Trash2 />
                      </Button>
                    </div>
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
