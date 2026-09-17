import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { EmptyState } from "@/_components/ui/empty-state";
import { SearchInput } from "@/_components/ui/search-input";
import { formatCurrency } from "@/_lib/format-currency";
import { toTitleCase } from "@/_lib/to-title-case";
import { buildReservedSupplyQuantities, getMaxProducibleQuantity } from "@/_lib/recipe-cost";
import { TCategory, TOrderPanel, TProduct } from "../interface";
import { isDraftOrder } from "../order-math";
import { ScrollText } from "lucide-react";
import { Header } from "@/_components/ui/header";
import Link from "next/link";

function QuantityBadge({ quantity, className = "" }: { quantity: number; className?: string }) {
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow ${className}`}
    >
      {quantity}
    </span>
  );
}

function ProductButton({
  product,
  quantity,
  outOfStock,
  lowStockClassName,
  stockLabel,
  listLayout,
  onClick,
}: {
  product: TProduct;
  quantity: number;
  outOfStock: boolean;
  lowStockClassName: string;
  stockLabel: ReactNode;
  listLayout: boolean | undefined;
  onClick: () => void;
}) {
  return (
    <Button
      size="lg"
      variant="secondary"
      onClick={onClick}
      disabled={outOfStock}
      className={
        listLayout
          ? `h-auto w-full justify-between gap-3 px-4 py-3 ${lowStockClassName}`
          : `relative h-28 min-w-32 bg-muted hover:bg-muted-foreground/20 ${lowStockClassName}`
      }
    >
      {listLayout ? (
        <>
          <span className="flex items-center gap-2">
            {quantity > 0 && <QuantityBadge quantity={quantity} />}
            <span className="text-sm font-bold whitespace-normal">{toTitleCase(product.name)}</span>
          </span>

          <span className="flex items-center gap-2">
            {stockLabel}
            <span className="text-sm font-medium">{formatCurrency(product.price)}</span>
          </span>
        </>
      ) : (
        <>
          {quantity > 0 && <QuantityBadge quantity={quantity} className="absolute -top-2 -right-2 z-10" />}

          <div className="flex flex-col items-center gap-1">
            <span className="text-center text-sm font-bold whitespace-normal">{toTitleCase(product.name)}</span>
            <span className="text-xs font-medium p-0">{formatCurrency(product.price)}</span>
            {stockLabel}
          </div>
        </>
      )}
    </Button>
  );
}

export function OrderPanel({
  categories,
  selectedCategory,
  handleCategoryClick,
  filteredProducts,
  products,
  supplyItems,
  onAddProduct,
  order,
  stockError,
  hideHeader,
  listLayout,
}: TOrderPanel) {
  const [searchTerm, setSearchTerm] = useState("");

  const reservedQuantities = useMemo(
    () => (order && isDraftOrder(order) && products ? buildReservedSupplyQuantities(order.orderItems, products) : {}),
    [order, products],
  );

  const visibleProducts =
    listLayout && searchTerm.trim()
      ? products?.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : filteredProducts;

  const recipeAvailabilityByProductId = useMemo(() => {
    const map = new Map<number, number | null>();

    visibleProducts?.forEach((product) => {
      if (product.recipe.length > 0) {
        map.set(product.id, getMaxProducibleQuantity(product.recipe, supplyItems ?? [], reservedQuantities));
      }
    });

    return map;
  }, [visibleProducts, supplyItems, reservedQuantities]);

  return (
    <section className={hideHeader ? "flex h-full w-full min-w-0 flex-col" : "flex min-w-0 flex-col w-full md:h-screen"}>
      {!hideHeader && (
        <>
          <div className="flex flex-col p-4 w-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Header title="PDV" />
              {!listLayout && (
                <div className="flex gap-3">
                  <Button variant="secondary" asChild size="lg">
                    <Link href="/order-detail">
                      <ScrollText />
                      Comandas
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator className="h-px bg-border" />
        </>
      )}

      {stockError && <p className="mx-4 mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{stockError}</p>}

      <div className="flex gap-3 px-4 pt-4 pb-2 rounded-xl overflow-x-auto no-scrollbar">
        {categories?.map((category: TCategory) => (
          <Button
            key={category.id}
            size="lg"
            onClick={() => handleCategoryClick(category.id)}
            variant={selectedCategory?.id === category.id ? "default" : "outline"}
            className="shrink-0"
          >
            {toTitleCase(category.name)}
          </Button>
        ))}
      </div>

      {listLayout && (
        <div className="px-4 pb-2">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar produto..." className="w-full" />
        </div>
      )}

      <div className="@container rounded-xl md:flex-1 md:overflow-y-auto no-scrollbar">
        <div
          className={
            listLayout
              ? "flex flex-col p-4 gap-2"
              : "p-4 grid grid-cols-2 @md:grid-cols-3 @2xl:grid-cols-4 @5xl:grid-cols-5 gap-4"
          }
        >
          {!visibleProducts || visibleProducts.length === 0 ? (
            <EmptyState message="Nenhum produto encontrado." className="col-span-full" />
          ) : (
            visibleProducts.map((product: TProduct) => {
              const orderItem = order?.orderItems?.find((item) => item.product.id === product.id);
              const quantity = orderItem?.quantity ?? 0;
              const available =
                product.recipe.length > 0
                  ? (recipeAvailabilityByProductId.get(product.id) ?? null)
                  : product.trackStock
                    ? product.quantity - quantity
                    : null;
              const outOfStock = available !== null && available <= 0;
              const lowStockThreshold = product.lowStockThreshold ?? 5;
              const isLowStock = available !== null && available <= lowStockThreshold;
              const lowStockClassName = outOfStock
                ? "bg-muted dark:bg-muted-foreground/25"
                : isLowStock
                  ? "bg-destructive/5 hover:bg-destructive/10 dark:bg-destructive/10 dark:hover:bg-destructive/25"
                  : "";

              const stockLabel = outOfStock ? (
                <span className="text-[10px] font-semibold text-destructive">Esgotado</span>
              ) : (
                isLowStock && <span className="text-[10px] font-semibold text-destructive">Restam {available}</span>
              );

              return (
                <ProductButton
                  key={product.id}
                  product={product}
                  quantity={quantity}
                  outOfStock={outOfStock}
                  lowStockClassName={lowStockClassName}
                  stockLabel={stockLabel}
                  listLayout={listLayout}
                  onClick={() => onAddProduct(product)}
                />
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
