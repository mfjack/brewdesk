"use client";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/_components/ui/table";
import { Badge } from "@/_components/ui/badge";
import { EmptyState } from "@/_components/ui/empty-state";
import { RowActions } from "@/_components/ui/row-actions";
import { AlertTriangle, Pencil, Plus } from "lucide-react";

import { useGetSupplyItems } from "./query/useGetSupplyItems";
import { useGetSuppliers } from "../supplier/query/useGetSuppliers";
import { useDeleteSupplyItem } from "./mutation/useDeleteSupplyItem";
import { StockFormDialog } from "./_components/stock-form-dialog";
import type { TSupplyItem } from "../order/interface";
import { formatCurrency } from "@/_lib/format-currency";
import { formatUnit } from "@/_lib/supply-units";
import { toTitleCase } from "@/_lib/to-title-case";
import { formatDate } from "@/_lib/format-date";

const EXPIRY_WARNING_DAYS = 7;

function getExpiryStatus(expiresAt: string | null) {
  if (!expiresAt) {
    return null;
  }

  const daysUntilExpiry = Math.ceil((new Date(`${expiresAt}T00:00:00`).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  if (daysUntilExpiry < 0) {
    return "expired" as const;
  }

  if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) {
    return "soon" as const;
  }

  return null;
}

export default function StockPage() {
  const { data: supplyItems } = useGetSupplyItems();
  const { data: suppliers } = useGetSuppliers();
  const deleteSupplyItem = useDeleteSupplyItem();

  function handleDeleteSupplyItem(supplyItemId: number) {
    deleteSupplyItem.mutate(supplyItemId);
  }

  const lowStockItems = supplyItems?.filter((item) => item.quantity <= item.minQuantity) ?? [];

  const supplierName = (supplierId: number | null) =>
    supplierId ? suppliers?.find((supplier) => supplier.id === supplierId)?.companyName : undefined;

  return (
    <section className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 flex-wrap gap-2">
        <Header
          title="Estoque"
          description={lowStockItems.length > 0 ? `${lowStockItems.length} insumo(s) com estoque baixo` : undefined}
        />

        <StockFormDialog
          suppliers={suppliers}
          trigger={
            <Button size="lg">
              <Plus />
              Adicionar insumo
            </Button>
          }
        />
      </div>

      <Separator className="h-px w-full" />

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {supplyItems?.length === 0 ? (
          <EmptyState message="Nenhum insumo cadastrado." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {supplyItems?.map((supplyItem: TSupplyItem) => {
                const expiryStatus = getExpiryStatus(supplyItem.expiresAt);
                const isLowStock = supplyItem.quantity <= supplyItem.minQuantity;

                return (
                  <TableRow key={supplyItem.id}>
                    <TableCell className="font-medium whitespace-normal">{toTitleCase(supplyItem.name)}</TableCell>

                    <TableCell className="text-muted-foreground">
                      {supplyItem.brand ? toTitleCase(supplyItem.brand) : "—"}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={isLowStock ? "font-semibold text-destructive" : ""}>
                          {Number(supplyItem.quantity.toFixed(2))}
                          {formatUnit(supplyItem.unit)}
                        </span>

                        {isLowStock && (
                          <Badge variant="outline" className="gap-1">
                            <AlertTriangle />
                            Estoque baixo
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Cadastrado: {Number(supplyItem.initialQuantity.toFixed(2))}
                        {formatUnit(supplyItem.unit)}
                      </p>
                    </TableCell>

                    <TableCell>{formatCurrency(supplyItem.costPrice)}</TableCell>

                    <TableCell className="text-muted-foreground">
                      {supplierName(supplyItem.supplierId) ? toTitleCase(supplierName(supplyItem.supplierId)!) : "—"}
                    </TableCell>

                    <TableCell>
                      {supplyItem.expiresAt ? (
                        <div className="flex items-center gap-2">
                          <span className={expiryStatus ? "font-semibold text-destructive" : "text-muted-foreground"}>
                            {formatDate(`${supplyItem.expiresAt}T00:00:00`)}
                          </span>

                          {expiryStatus === "expired" && <Badge variant="destructive">Vencido</Badge>}
                          {expiryStatus === "soon" && (
                            <Badge variant="outline" className="gap-1">
                              <AlertTriangle />
                              Vence em breve
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <RowActions
                        editTrigger={
                          <StockFormDialog
                            suppliers={suppliers}
                            supplyItem={supplyItem}
                            trigger={
                              <Button variant="outline" size="icon-sm">
                                <Pencil />
                              </Button>
                            }
                          />
                        }
                        onDelete={() => handleDeleteSupplyItem(supplyItem.id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}
