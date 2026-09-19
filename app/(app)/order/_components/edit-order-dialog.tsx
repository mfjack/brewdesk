import { Trash2, Send, Ban } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Separator } from "@/_components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/_components/ui/dialog";

import { OrderPanel } from "./order-panel";
import { TCategory, TOrderItem, TOrderResponse, TProduct, TSupplyItem } from "../interface";

import { formatCurrency } from "@/_lib/format-currency";
import { toTitleCase } from "@/_lib/to-title-case";

interface TEditOrderDialog {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: TOrderResponse;
  categories: TCategory[];
  selectedCategory: TCategory | null;
  onCategoryClick: (categoryId: number) => void;
  filteredProducts: TProduct[] | undefined;
  products: TProduct[] | undefined;
  supplyItems: TSupplyItem[] | undefined;
  onAddProduct: (product: TProduct) => void;
  onRemoveItem: (itemId: number) => void;
  isRemovingItem: boolean;
  stockError?: string | null;
  onResendFullOrder: () => void;
  isResendingFullOrder: boolean;
  onRequestCancelOrder: () => void;
}

export function EditOrderDialog({
  open,
  onOpenChange,
  order,
  categories,
  selectedCategory,
  onCategoryClick,
  filteredProducts,
  products,
  supplyItems,
  onAddProduct,
  onRemoveItem,
  isRemovingItem,
  stockError,
  onResendFullOrder,
  isResendingFullOrder,
  onRequestCancelOrder,
}: TEditOrderDialog) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] flex-col sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Alterar pedido</DialogTitle>
          <DialogDescription>
            Ajuste os itens da comanda de {toTitleCase(order.customerName)} e reenvie um pedido completo pra cozinha.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
          <div className="min-h-0 flex-1 overflow-y-auto p-3 no-scrollbar">
            <OrderPanel
              categories={categories}
              selectedCategory={selectedCategory}
              handleCategoryClick={onCategoryClick}
              filteredProducts={filteredProducts}
              products={products}
              supplyItems={supplyItems}
              onAddProduct={onAddProduct}
              order={order}
              stockError={stockError}
              hideHeader
            />
          </div>

          <Separator orientation="vertical" className="hidden w-px bg-border md:block" />
          <Separator className="h-px bg-border md:hidden" />

          <div className="flex min-h-0 w-full flex-col gap-3 md:w-80">
            <p className="text-sm font-medium">Itens da comanda</p>

            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-0.5">
              {order.orderItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhum item na comanda.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {order.orderItems.map((item: TOrderItem) => (
                    <Card key={item.id} className="flex flex-row items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {item.quantity}
                        </span>
                        <p className="text-sm font-medium">{toTitleCase(item.product.name)}</p>
                      </div>

                      <Button size="icon-sm" variant="ghost" onClick={() => onRemoveItem(item.id)} disabled={isRemovingItem}>
                        <Trash2 className="text-destructive" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Total:</p>
              <span className="text-sm font-bold">{formatCurrency(order.total)}</span>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={onResendFullOrder}
                disabled={isResendingFullOrder || order.orderItems.length === 0}
              >
                <Send />
                {isResendingFullOrder ? "Reenviando..." : "Reenviar pedido completo"}
              </Button>

              <Button type="button" variant="destructive" onClick={onRequestCancelOrder} disabled={isResendingFullOrder}>
                <Ban />
                Cancelar comanda
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
