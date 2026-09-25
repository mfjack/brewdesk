import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";

import type { TOrderResponse, TStoreSettings } from "@/app/(app)/order/interface";
import { getChargedTakeoutFee, groupItemsByCategory } from "@/app/(app)/order/order-math";
import { formatCurrency } from "@/_lib/format-currency";
import { formatDateTime } from "@/_lib/format-date";
import { toTitleCase } from "@/_lib/to-title-case";

export interface TReceiptEncoderOptions {
  order: TOrderResponse;
  settings: TStoreSettings | undefined;
  observation?: string;
  printMode: "full" | "additional";
  printedItemQuantities?: Record<number, number>;
  groupedCustomerNames?: string[];
}

export function buildReceiptBytes({
  order,
  settings,
  observation,
  printMode,
  printedItemQuantities = {},
  groupedCustomerNames = [],
}: TReceiptEncoderOptions): Uint8Array | null {
  const isAdditional = printMode === "additional";

  const displayItems = isAdditional
    ? order.orderItems
        .map((item) => ({ ...item, quantity: item.quantity - (printedItemQuantities[item.id] ?? 0) }))
        .filter((item) => item.quantity > 0)
    : order.orderItems;

  if (isAdditional && displayItems.length === 0) {
    return null;
  }

  const receiptObservation = order.observation ?? observation;

  const encoder = new ReceiptPrinterEncoder({ language: "esc-pos" });
  const priceColumnWidth = 10;
  const columns = [
    { width: encoder.columns - priceColumnWidth, align: "left" as const },
    { width: priceColumnWidth, align: "right" as const },
  ];

  encoder.initialize().align("center").bold(true).text(settings?.name ?? "").bold(false).newline();

  if (settings?.cnpj) {
    encoder.align("left").text(`CNPJ: ${settings.cnpj}`).newline();
  }

  settings?.address?.split("\n").forEach((line) => {
    encoder.align("left").text(line).newline();
  });

  if (settings?.phone) {
    encoder.align("left").text(`Tel: ${settings.phone}`).newline();
  }

  encoder
    .rule()
    .align("left")
    .text(`Data: ${formatDateTime(order.createdAt)}`)
    .newline()
    .text("Cliente: ")
    .bold(true)
    .text((order.customerName || "Sem nome").toUpperCase())
    .bold(false)
    .newline();

  if (order.isTakeout) {
    encoder.align("center").bold(true).text("*** PARA LEVAR ***").bold(false).newline();
  }

  if (groupedCustomerNames.length > 0) {
    encoder
      .align("center")
      .bold(true)
      .text(`*** JUNTO COM: ${groupedCustomerNames.join(", ").toUpperCase()} ***`)
      .bold(false)
      .newline();
  }

  if (receiptObservation) {
    encoder.align("left").text("Observação: ").bold(true).text(receiptObservation).bold(false).newline();
  }

  encoder.rule();

  encoder.size(1, 2);

  // Items always print grouped/sorted by category — the feature flag only decides whether
  // the category name header is printed above each group, not the ordering itself.
  const itemGroups = groupItemsByCategory(displayItems);
  const showCategoryNames = settings?.featureFlags.receiptCategories ?? true;

  itemGroups.forEach((group) => {
    if (showCategoryNames && group.categoryName) {
      encoder.bold(true).text(group.categoryName.toUpperCase()).bold(false).newline();
    }

    group.items.forEach((item) => {
      encoder.table(columns, [[`${item.quantity}x ${toTitleCase(item.product.name)}`, formatCurrency(item.quantity * item.unitPrice)]]);
    });
  });

  encoder.size(1, 1);

  if (!isAdditional && order.isTakeout) {
    encoder.table(columns, [["Embalagem para levar", formatCurrency(getChargedTakeoutFee(order))]]);
  }

  const total = isAdditional ? displayItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) : order.total;

  encoder
    .rule()
    .bold(true)
    .table(columns, [[isAdditional ? "Subtotal Adicionais" : "Total", formatCurrency(total)]])
    .bold(false);

  if (settings?.receiptFooterMessage) {
    encoder.newline().align("center").text(settings.receiptFooterMessage).newline();
  }

  encoder.newline(6).cut();

  return encoder.encode();
}
