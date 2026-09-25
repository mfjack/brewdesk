import { formatCurrency } from "@/_lib/format-currency";
import { formatDateTime } from "@/_lib/format-date";

import { TOrderResponse } from "../interface";
import { getChargedTakeoutFee, groupItemsByCategory } from "../order-math";
import { toTitleCase } from "@/_lib/to-title-case";
import { useGetSettings } from "@/app/(app)/settings/query/useGetSettings";

interface TOrderReceipt {
  order: TOrderResponse;

  observation?: string;

  printMode?: "full" | "additional" | null;

  printedItemQuantities?: Record<number, number>;

  groupedCustomerNames?: string[];

  // Prints these orders' own items on the same physical ticket, each under its own
  // "Cliente:" section right after the primary order's, instead of the default "*** JUNTO
  // COM ***" banner-only behavior — used when the operator explicitly asks to combine two
  // people's orders into one printout instead of each printing its own separate ticket.
  additionalOrders?: TOrderResponse[];
}

function OrderReceiptSection({
  order,
  isAdditional,
  printedItemQuantities,
  showCategoryNames,
}: {
  order: TOrderResponse;
  isAdditional: boolean;
  printedItemQuantities: Record<number, number>;
  showCategoryNames: boolean;
}) {
  const displayItems = isAdditional
    ? order.orderItems
        .map((item) => ({
          ...item,
          quantity: item.quantity - (printedItemQuantities[item.id] ?? 0),
        }))
        .filter((item) => item.quantity > 0)
    : order.orderItems;

  const itemGroups = groupItemsByCategory(displayItems);
  const subtotal = displayItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-xs">
        <span>Cliente:</span>
        <span className="text-base font-medium uppercase">{order.customerName || "Sem nome"}</span>
      </div>

      {order.isTakeout && <p className="text-center text-base font-bold">*** PARA LEVAR ***</p>}

      {order.observation && (
        <p className="text-xs">
          Observação: <strong>{order.observation}</strong>
        </p>
      )}

      {showCategoryNames ? (
        <div className="space-y-2">
          {itemGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.categoryName && (
                <p className="text-xs font-bold uppercase border-b border-dashed border-foreground/40 pb-0.5 mb-1">
                  {group.categoryName}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs font-semibold">
                    <span className="flex gap-1">
                      {item.quantity}x <p>{toTitleCase(item.product.name)}</p>
                    </span>

                    <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Same category-sorted order as above, but flattened into one list with no gaps
        // between groups, since there's no header to justify the extra spacing.
        <div className="space-y-1">
          {itemGroups.flatMap((group) =>
            group.items.map((item) => (
              <div key={item.id} className="flex justify-between text-xs font-semibold">
                <span className="flex gap-1">
                  {item.quantity}x <p>{toTitleCase(item.product.name)}</p>
                </span>

                <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
              </div>
            )),
          )}
        </div>
      )}

      {!isAdditional && order.isTakeout && (
        <div className="flex justify-between text-xs font-semibold">
          <span>Embalagem para levar</span>
          <span>{formatCurrency(getChargedTakeoutFee(order))}</span>
        </div>
      )}

      <div className="flex justify-between text-xs font-semibold">
        <span>{isAdditional ? "Subtotal Adicionais" : "Subtotal"}</span>
        <span>{formatCurrency(isAdditional ? subtotal : order.total)}</span>
      </div>
    </div>
  );
}

export function OrderReceipt({
  order,
  observation,
  printMode,
  printedItemQuantities = {},
  groupedCustomerNames = [],
  additionalOrders = [],
}: TOrderReceipt) {
  const { data: settings } = useGetSettings();

  const isAdditional = printMode === "additional";

  const hasNewItemsToPrint = !isAdditional
    ? true
    : order.orderItems.some((item) => item.quantity - (printedItemQuantities[item.id] ?? 0) > 0);

  const shouldDisplay = printMode === "full" || (printMode === "additional" && hasNewItemsToPrint);

  if (!shouldDisplay) {
    return null;
  }

  const showCategoryNames = settings?.featureFlags.receiptCategories ?? true;
  const isCombined = additionalOrders.length > 0;
  const combinedTotal = order.total + additionalOrders.reduce((sum, additionalOrder) => sum + additionalOrder.total, 0);

  return (
    <div className="order-receipt hidden px-2 h-fit print:block">
      {/* Scoped to only while this component is mounted (i.e. only during an actual receipt
          print job) instead of a named `@page receipt` rule — Chrome doesn't reliably honor
          named pages, so that override silently fell back to the shared `@page { margin:
          1cm }` below, leaving a real 1cm gap above the title on every receipt. Other print
          views (report, shopping list) never mount alongside this one, so this can't affect
          them. */}
      <style>{"@media print { @page { size: 80mm auto; margin: 0; } }"}</style>

      <h1 className="text-base font-bold text-center mt-0 mb-2">{settings?.name}</h1>

      <div className="border-b pb-2 mb-2 text-start">
        {settings?.cnpj && <p className="text-xs">CNPJ: {settings.cnpj}</p>}

        {settings?.address?.split("\n").map((line, index) => (
          <p key={index} className="text-xs">
            {line}
          </p>
        ))}

        {settings?.phone && <p className="text-xs">Tel: {settings.phone}</p>}
      </div>

      <div className="border-b pb-2 mb-2 text-xs">
        <p>Data: {formatDateTime(order.createdAt)}</p>

        {!isCombined && groupedCustomerNames.length > 0 && (
          <p className="mt-1 text-center text-base font-bold">
            *** JUNTO COM: {groupedCustomerNames.join(", ").toUpperCase()} ***
          </p>
        )}

        {observation && !order.observation && (
          <p>
            Observação: <strong>{observation}</strong>
          </p>
        )}
      </div>

      <div className="space-y-3">
        <OrderReceiptSection
          order={order}
          isAdditional={isAdditional}
          printedItemQuantities={printedItemQuantities}
          showCategoryNames={showCategoryNames}
        />

        {additionalOrders.map((additionalOrder) => (
          <div key={additionalOrder.id} className="border-t border-dashed pt-3">
            <OrderReceiptSection
              order={additionalOrder}
              isAdditional={false}
              printedItemQuantities={{}}
              showCategoryNames={showCategoryNames}
            />
          </div>
        ))}
      </div>

      {isCombined && (
        <div className="border-t mt-3 pt-2 flex justify-between font-bold text-xs">
          <span>Total Geral</span>
          <span>{formatCurrency(combinedTotal)}</span>
        </div>
      )}

      {settings?.receiptFooterMessage && <p className="mt-3 text-center text-xs">{settings.receiptFooterMessage}</p>}
    </div>
  );
}
