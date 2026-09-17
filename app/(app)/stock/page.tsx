"use client";

import { useMemo, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { Header } from "@/_components/ui/header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/_components/ui/table";
import { Badge } from "@/_components/ui/badge";
import { EmptyState } from "@/_components/ui/empty-state";
import { RowActions } from "@/_components/ui/row-actions";
import { SearchInput } from "@/_components/ui/search-input";
import { AlertTriangle, Link2, MessageCircle, Pencil, Plus, ShoppingCart } from "lucide-react";

import { useGetSupplyItems } from "./query/useGetSupplyItems";
import { useGetSuppliers } from "../supplier/query/useGetSuppliers";
import { useGetProducts } from "../product/query/useGetProducts";
import { useDeleteSupplyItem } from "./mutation/useDeleteSupplyItem";
import { StockFormDialog } from "./_components/stock-form-dialog";
import { ShoppingListDialog } from "./_components/shopping-list-dialog";
import { ShoppingListPrintView } from "./_components/shopping-list-print-view";
import type { TSupplyItem } from "../order/interface";
import { formatCurrency } from "@/_lib/format-currency";
import { formatSupplyQuantity, isBelowMinQuantity } from "@/_lib/supply-units";
import { toTitleCase } from "@/_lib/to-title-case";
import { formatDate } from "@/_lib/format-date";
import { buildShoppingListGroups } from "@/_lib/shopping-list";
import { useShoppingListDismissals } from "@/_lib/use-shopping-list-dismissals";
import { buildWhatsappLink } from "@/_lib/whatsapp-link";
import { shortenUrl } from "@/_lib/shorten-url";
import { useIsHydrated } from "@/_lib/use-is-hydrated";
import Link from "next/link";

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
  const { data: supplyItemsData } = useGetSupplyItems();
  const { data: suppliers } = useGetSuppliers();
  const { data: products } = useGetProducts();
  const isHydrated = useIsHydrated();
  const supplyItems = isHydrated ? supplyItemsData : undefined;
  const deleteSupplyItem = useDeleteSupplyItem();
  const [searchTerm, setSearchTerm] = useState("");

  function handleDeleteSupplyItem(supplyItemId: number) {
    deleteSupplyItem.mutate(supplyItemId);
  }

  const lowStockItems = supplyItems?.filter((item) => isBelowMinQuantity(item.quantity, item.minQuantity)) ?? [];

  const filteredSupplyItems = supplyItems?.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const rawShoppingListGroups = useMemo(
    () => buildShoppingListGroups(supplyItems ?? [], products ?? [], suppliers ?? []),
    [supplyItems, products, suppliers],
  );

  const shoppingListItemIds = useMemo(
    () => rawShoppingListGroups.flatMap((group) => group.items.map((item) => item.id)),
    [rawShoppingListGroups],
  );

  const { dismissedIds, clearList } = useShoppingListDismissals(shoppingListItemIds);

  const shoppingListGroups = rawShoppingListGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => !dismissedIds.has(item.id)) }))
    .filter((group) => group.items.length > 0);

  const findSupplier = (supplierId: number | null) =>
    supplierId ? suppliers?.find((supplier) => supplier.id === supplierId) : undefined;

  return (
    <>
      <ShoppingListPrintView groups={shoppingListGroups} />

      <section className="flex flex-col h-screen print:hidden">
        <div className="flex items-center justify-between p-4 flex-wrap gap-2">
          <Header
            title="Estoque"
            description={lowStockItems.length > 0 ? `${lowStockItems.length} insumo(s) com estoque baixo` : undefined}
          />

          <div className="flex gap-2">
            <ShoppingListDialog
              groups={shoppingListGroups}
              onClearList={clearList}
              trigger={
                <Button size="lg" variant="outline">
                  <ShoppingCart />
                  Lista de compras
                </Button>
              }
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
        </div>

        <Separator className="h-px w-full" />

        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {supplyItems?.length === 0 ? (
            <EmptyState message="Nenhum insumo cadastrado." />
          ) : (
            <>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Filtrar por nome do insumo..."
                className="mb-4 max-w-100"
              />

              {filteredSupplyItems?.length === 0 ? (
                <EmptyState message="Nenhum insumo encontrado com esse nome." />
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
                    {filteredSupplyItems?.map((supplyItem: TSupplyItem) => {
                      const expiryStatus = getExpiryStatus(supplyItem.expiresAt);
                      const isLowStock = isBelowMinQuantity(supplyItem.quantity, supplyItem.minQuantity);
                      const itemSupplier = findSupplier(supplyItem.supplierId);

                      return (
                        <TableRow key={supplyItem.id}>
                          <TableCell className="font-medium whitespace-normal">{toTitleCase(supplyItem.name)}</TableCell>

                          <TableCell className="text-muted-foreground">
                            {supplyItem.brand ? toTitleCase(supplyItem.brand) : "—"}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={isLowStock ? "font-semibold text-destructive" : ""}>
                                {formatSupplyQuantity(supplyItem.quantity, supplyItem.unit)}
                              </span>

                              {isLowStock && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle />
                                  Estoque baixo
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground">
                              Cadastrado: {formatSupplyQuantity(supplyItem.initialQuantity, supplyItem.unit)}
                            </p>
                          </TableCell>

                          <TableCell>{formatCurrency(supplyItem.costPrice)}</TableCell>

                          <TableCell className="text-muted-foreground">
                            {itemSupplier ? (
                              <div className="flex flex-col gap-0.5">
                                <span>{toTitleCase(itemSupplier.companyName)}</span>

                                {itemSupplier.whatsapp ? (
                                  <Link
                                    href={buildWhatsappLink(itemSupplier.whatsapp)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs underline"
                                  >
                                    <MessageCircle size={12} />
                                    {itemSupplier.whatsapp}
                                  </Link>
                                ) : (
                                  itemSupplier.purchaseLink && (
                                    <Link
                                      href={itemSupplier.purchaseLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs underline"
                                    >
                                      <Link2 size={12} />
                                      {shortenUrl(itemSupplier.purchaseLink)}
                                    </Link>
                                  )
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
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
                              deleteConfirmTitle={`Excluir "${toTitleCase(supplyItem.name)}"?`}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
