import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";

import type { TOrderItem, TOrderResponse, TStoreSettings } from "@/app/(app)/order/interface";
import { getChargedTakeoutFee, groupItemsByCategory } from "@/app/(app)/order/order-math";
import { formatCurrency } from "@/_lib/format-currency";
import { formatDate, formatTime } from "@/_lib/format-date";
import { toTitleCase } from "@/_lib/to-title-case";

export interface TReceiptEncoderOptions {
  order: TOrderResponse;
  settings: TStoreSettings | undefined;
  observation?: string;
  printMode: "full" | "additional";
  printedItemQuantities?: Record<number, number>;
  // Prints these orders' own items right after the primary order's, each under its own
  // "Cliente:" line and subtotal, on this same physical ticket — used for "Junto com"
  // (orders linked only to be prepared/printed together, never for payment).
  additionalOrders?: TOrderResponse[];
}

type TReceiptColumns = { width: number; align: "left" | "right" }[];

// Standard font-A column counts for these paper widths across ESC/POS thermal printers —
// printing at the wrong column count causes the line wrap point to land in the wrong place.
export function getEncoderColumns(paperWidth: TStoreSettings["featureFlags"]["thermalPrinterPaperWidth"] | undefined): number {
  return paperWidth === "58mm" ? 32 : 42;
}

export function buildReceiptColumns(totalColumns: number): TReceiptColumns {
  const priceColumnWidth = 10;

  return [
    { width: totalColumns - priceColumnWidth, align: "left" },
    { width: priceColumnWidth, align: "right" },
  ];
}

// Items always print grouped/sorted by category — the feature flag only decides whether the
// category name header is printed above each group, not the ordering itself. Returns the
// items' combined subtotal, since "additional" mode needs it and has no order.total to use.
function writeOrderItems(
  encoder: ReceiptPrinterEncoder,
  columns: TReceiptColumns,
  items: TOrderItem[],
  showCategoryNames: boolean,
): number {
  encoder.size(1, 2);

  groupItemsByCategory(items).forEach((group) => {
    if (showCategoryNames && group.categoryName) {
      encoder.bold(true).text(group.categoryName.toUpperCase()).bold(false).newline();
    }

    group.items.forEach((item) => {
      encoder.table(columns, [[`${item.quantity}x ${toTitleCase(item.product.name)}`, formatCurrency(item.quantity * item.unitPrice)]]);
    });
  });

  encoder.size(1, 1);

  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function buildReceiptBytes({
  order,
  settings,
  observation,
  printMode,
  printedItemQuantities = {},
  additionalOrders = [],
}: TReceiptEncoderOptions): Uint8Array | null {
  const isAdditional = printMode === "additional";
  const isCombined = additionalOrders.length > 0;

  const displayItems = isAdditional
    ? order.orderItems
        .map((item) => ({ ...item, quantity: item.quantity - (printedItemQuantities[item.id] ?? 0) }))
        .filter((item) => item.quantity > 0)
    : order.orderItems;

  if (isAdditional && displayItems.length === 0) {
    return null;
  }

  const receiptObservation = order.observation ?? observation;
  const showCategoryNames = settings?.featureFlags.receiptCategories ?? true;

  const encoder = new ReceiptPrinterEncoder({
    language: "esc-pos",
    columns: getEncoderColumns(settings?.featureFlags.thermalPrinterPaperWidth),
  });
  const columns = buildReceiptColumns(encoder.columns);

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
    .text(`Data: ${formatDate(order.createdAt)}, ${formatTime(order.createdAt)}`)
    .newline()
    .text("Cliente: ")
    .bold(true)
    .text((order.customerName || "Sem nome").toUpperCase())
    .bold(false)
    .newline();

  if (order.isTakeout) {
    encoder.align("center").bold(true).text("*** PARA LEVAR ***").bold(false).newline().align("left");
  }

  if (receiptObservation) {
    encoder.text("Observação: ").bold(true).text(receiptObservation).bold(false).newline();
  }

  encoder.rule();

  const primarySubtotal = writeOrderItems(encoder, columns, displayItems, showCategoryNames);

  if (!isAdditional && order.isTakeout) {
    encoder.table(columns, [["Embalagem para levar", formatCurrency(getChargedTakeoutFee(order))]]);
  }

  const primaryTotal = isAdditional ? primarySubtotal : order.total;

  encoder
    .rule()
    .bold(true)
    .table(columns, [[isAdditional ? "Subtotal Adicionais" : isCombined ? "Subtotal" : "Total", formatCurrency(primaryTotal)]])
    .bold(false);

  let combinedTotal = order.total;

  additionalOrders.forEach((additionalOrder) => {
    encoder
      .rule()
      .text("Cliente: ")
      .bold(true)
      .text((additionalOrder.customerName || "Sem nome").toUpperCase())
      .bold(false)
      .newline();

    if (additionalOrder.isTakeout) {
      encoder.align("center").bold(true).text("*** PARA LEVAR ***").bold(false).newline().align("left");
    }

    writeOrderItems(encoder, columns, additionalOrder.orderItems, showCategoryNames);

    if (additionalOrder.isTakeout) {
      encoder.table(columns, [["Embalagem para levar", formatCurrency(getChargedTakeoutFee(additionalOrder))]]);
    }

    encoder.bold(true).table(columns, [["Subtotal", formatCurrency(additionalOrder.total)]]).bold(false);

    combinedTotal += additionalOrder.total;
  });

  if (isCombined) {
    encoder.rule().bold(true).table(columns, [["Total Geral", formatCurrency(combinedTotal)]]).bold(false);
  }

  if (settings?.receiptFooterMessage) {
    encoder.newline().align("center").text(settings.receiptFooterMessage).newline();
  }

  // Feeds enough blank paper for the last printed line to clear the physical gap between
  // the print head and the cutter blade before cutting — too little feed here cuts above
  // content that hasn't passed the cutter yet, leaving it stuck on the roll to print
  // (looking like leftover content from the previous receipt) the next time something feeds.
  encoder.newline(10).cut();

  return encoder.encode();
}
