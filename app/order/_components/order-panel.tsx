import { Button } from "@/_components/ui/button";
import { Separator } from "@/_components/ui/separator";
import { formatCurrency } from "@/_lib/format-currency";
import { TCategory, TOrderPanel, TProduct } from "../interface";
import { ScrollText } from "lucide-react";
import { Header } from "@/_components/ui/header";
import Link from "next/link";

export function OrderPanel({
  categories,
  selectedCategory,
  handleCategoryClick,
  filteredProducts,
  onAddProduct,
  order,
  stockError,
}: TOrderPanel) {
  return (
    <section className="flex flex-col h-screen w-full">
      <div className="flex flex-col p-4 w-full">
        <div className="flex items-center justify-between">
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

      <div className="flex gap-3 p-4 rounded-xl">
        {categories?.map((category: TCategory) => (
          <Button
            key={category.id}
            size="lg"
            onClick={() => handleCategoryClick(category.id)}
            variant={selectedCategory?.id === category.id ? "default" : "outline"}
          >
            {category.name}
          </Button>
        ))}
      </div>

      <div className="rounded-xl flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <div className="p-4 grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {!filteredProducts || filteredProducts.length === 0 ? (
            <p className="col-span-full text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
          ) : (
            filteredProducts.map((product: TProduct) => {
              const orderItem = order?.orderItems?.find((item) => item.product.id === product.id);
              const quantity = orderItem?.quantity ?? 0;
              const available = product.trackStock ? product.quantity - quantity : null;
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
                    <span className="text-center text-sm font-bold whitespace-normal">{product.name}</span>
                    <span className="text-xs font-medium p-0">{formatCurrency(product.price)}</span>
                    {available !== null && (
                      <span className={`text-[10px] ${outOfStock ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                        {outOfStock ? "Esgotado" : `Restam ${available}`}
                      </span>
                    )}
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
