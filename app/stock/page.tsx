"use client";

import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/_components/ui/table";
import { Badge } from "@/_components/ui/badge";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";

import { useGetSupplyItems } from "./query/useGetSupplyItems";
import { useGetSuppliers } from "../supplier/query/useGetSuppliers";
import { useDeleteSupplyItem } from "./mutation/useDeleteSupplyItem";
import { StockFormDialog } from "./_components/stock-form-dialog";
import type { TSupplyItem } from "../order/interface";
import { formatCurrency } from "@/_lib/format-currency";
import { formatUnit, getSupplyTotal } from "@/_lib/supply-units";
import { toTitleCase } from "@/_lib/to-title-case";

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

  const lowStockItems =
    supplyItems?.filter((item) => getSupplyTotal(item.quantity, item.unitContent) <= item.minQuantity) ?? [];

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

      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
        {supplyItems?.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum insumo cadastrado.</p>
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
                const total = getSupplyTotal(supplyItem.quantity, supplyItem.unitContent);
                const isLowStock = total <= supplyItem.minQuantity;

                return (
                  <TableRow key={supplyItem.id}>
                    <TableCell className="font-medium whitespace-normal">{toTitleCase(supplyItem.name)}</TableCell>

                    <TableCell className="text-muted-foreground">
                      {supplyItem.brand ? toTitleCase(supplyItem.brand) : "—"}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={isLowStock ? "font-semibold text-destructive" : ""}>
                            {total}
                            {formatUnit(supplyItem.unit)}
                          </span>

                          {isLowStock && (
                            <Badge variant="outline" className="gap-1">
                              <AlertTriangle />
                              Estoque baixo
                            </Badge>
                          )}
                        </div>

                        {supplyItem.unitContent && (
                          <span className="text-xs text-muted-foreground">
                            {supplyItem.quantity} × {supplyItem.unitContent}
                            {formatUnit(supplyItem.unit)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{formatCurrency(supplyItem.costPrice)}</TableCell>

                    <TableCell className="text-muted-foreground">
                      {supplierName(supplyItem.supplierId) ? toTitleCase(supplierName(supplyItem.supplierId)!) : "—"}
                    </TableCell>

                    <TableCell>
                      {supplyItem.expiresAt ? (
                        <div className="flex items-center gap-2">
                          <span className={expiryStatus ? "font-semibold text-destructive" : "text-muted-foreground"}>
                            {new Date(`${supplyItem.expiresAt}T00:00:00`).toLocaleDateString("pt-BR")}
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
                      <div className="flex justify-end gap-2">
                        <StockFormDialog
                          suppliers={suppliers}
                          supplyItem={supplyItem}
                          trigger={
                            <Button variant="outline" size="icon-sm">
                              <Pencil />
                            </Button>
                          }
                        />

                        <Button variant="destructive" size="icon-sm" onClick={() => handleDeleteSupplyItem(supplyItem.id)}>
                          <Trash2 />
                        </Button>
                      </div>
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
