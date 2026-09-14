import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { EmptyState } from "@/_components/ui/empty-state";
import { formatCurrency } from "@/_lib/format-currency";
import { toTitleCase } from "@/_lib/to-title-case";
import { buildReservedSupplyQuantities, getMaxProducibleQuantity } from "@/_lib/recipe-cost";
import { TCategory, TOrderPanel, TProduct } from "../interface";
import { isDraftOrder } from "../order-math";
import { ScrollText } from "lucide-react";
import { Header } from "@/_components/ui/header";
import Link from "next/link";

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
}: TOrderPanel) {
  const reservedQuantities =
    order && isDraftOrder(order) && products ? buildReservedSupplyQuantities(order.orderItems, products) : {};
  return (
    <section className="flex flex-col w-full md:h-screen">
      <div className="flex flex-col p-4 w-full">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Header title="PDV" />
          <div className="flex gap-3">
            <Button variant="secondary" asChild size="lg">
              <Link href="/order-detail">
                <ScrollText />
                Comandas
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Separator className="h-px bg-border" />

      {stockError && <p className="mx-4 mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{stockError}</p>}

      {(() => {
        const lowStockCount =
          filteredProducts?.filter((product) => product.trackStock && product.quantity > 0 && product.quantity <= (product.lowStockThreshold ?? 5))
            .length ?? 0;

        return lowStockCount > 0 ? (
          <p className="mx-4 mt-4 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
            {lowStockCount} produto(s) com estoque baixo.
          </p>
        ) : null;
      })()}

      <div className="flex gap-3 p-4 rounded-xl overflow-x-auto no-scrollbar">
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

      <div className="rounded-xl md:flex-1 md:overflow-y-auto no-scrollbar">
        <div className="p-4 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {!filteredProducts || filteredProducts.length === 0 ? (
            <EmptyState message="Nenhum produto cadastrado." className="col-span-full" />
          ) : (
            filteredProducts.map((product: TProduct) => {
              const orderItem = order?.orderItems?.find((item) => item.product.id === product.id);
              const quantity = orderItem?.quantity ?? 0;
              const available =
                product.recipe.length > 0
                  ? getMaxProducibleQuantity(product.recipe, supplyItems ?? [], reservedQuantities)
                  : product.trackStock
                    ? product.quantity - quantity
                    : null;
              const outOfStock = available !== null && available <= 0;

              return (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => onAddProduct(product)}
                  key={product.id}
                  disabled={outOfStock}
                  className="relative h-24"
                >
                  {quantity > 0 && (
                    <span
                      className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center
                      rounded-full bg-primary text-xs font-bold text-primary-foreground shadow"
                    >
                      {quantity}
                    </span>
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-center text-sm font-bold whitespace-normal">{toTitleCase(product.name)}</span>
                    <span className="text-xs font-medium p-0">{formatCurrency(product.price)}</span>
                    {outOfStock && <span className="text-[10px] font-semibold text-destructive">Esgotado</span>}
                  </div>
                </Button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
