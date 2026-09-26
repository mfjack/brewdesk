import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";

import type { TStoreSettings } from "@/app/(app)/order/interface";
import type { HourlyPeak, ProductReportStats, ProductStat, ReportStats } from "@/app/(app)/report/query/useGetReportData";
import { buildReceiptColumns, getEncoderColumns } from "@/_lib/receipt-encoder";
import { formatCurrency } from "@/_lib/format-currency";
import { formatDateTime } from "@/_lib/format-date";

export interface TReportEncoderOptions {
  dateRangeLabel: string;
  reportData: ReportStats;
  selectedProduct: string | null;
  productReportData: ProductReportStats | null | undefined;
  settings: TStoreSettings | undefined;
}

function printProductTable(
  encoder: ReceiptPrinterEncoder,
  columns: ReturnType<typeof buildReceiptColumns>,
  title: string,
  products: ProductStat[],
) {
  encoder.bold(true).text(title.toUpperCase()).bold(false).newline();

  if (products.length === 0) {
    encoder.text("Nenhuma venda neste período.").newline();

    return;
  }

  products.forEach((product) => {
    encoder.table(columns, [[`${product.name} (${product.quantity}un.)`, formatCurrency(product.revenue)]]);
  });
}

// Mirrors <ReportReceipt>'s content (same sections, same numbers) so a shop whose only
// printer is a thermal one — no A4/laser printer at all — can still print the report, since
// window.print() has nothing to send to in that case.
export function buildReportReceiptBytes({
  dateRangeLabel,
  reportData,
  selectedProduct,
  productReportData,
  settings,
}: TReportEncoderOptions): Uint8Array {
  const encoder = new ReceiptPrinterEncoder({
    language: "esc-pos",
    columns: getEncoderColumns(settings?.featureFlags.thermalPrinterPaperWidth),
  });
  const columns = buildReceiptColumns(encoder.columns);

  const peaksWithSales: HourlyPeak[] = reportData.hourlyPeaks
    .filter((peak) => peak.orders > 0)
    .sort((a, b) => b.revenue - a.revenue);

  encoder.initialize().align("center").bold(true).text(settings?.name ?? "").bold(false).newline();
  encoder.text(`Relatório de Vendas — ${dateRangeLabel}`).newline();
  encoder.text(`Gerado em ${formatDateTime(new Date())}`).newline();
  encoder.rule();

  encoder.align("left");
  encoder.table(columns, [["Total de Vendas", formatCurrency(reportData.totalRevenue)]]);
  encoder.table(columns, [["Pedidos", String(reportData.ordersCount)]]);
  encoder.table(columns, [["Ticket Médio", formatCurrency(reportData.averageTicket)]]);
  encoder.table(columns, [["Itens Vendidos", String(reportData.totalItemsSold)]]);
  encoder.rule();

  if (selectedProduct && productReportData) {
    encoder.bold(true).text(`CONSULTA POR PRODUTO — ${selectedProduct.toUpperCase()}`).bold(false).newline();
    encoder.table(columns, [["Quantidade vendida", String(productReportData.totalItemsSold)]]);
    encoder.table(columns, [["Faturamento", formatCurrency(productReportData.totalRevenue)]]);
    encoder.rule();
  }

  printProductTable(encoder, columns, "Produtos Mais Vendidos", reportData.topProducts);
  encoder.rule();
  printProductTable(encoder, columns, "Produtos Menos Vendidos", reportData.bottomProducts);
  encoder.rule();

  encoder.bold(true).text("HORÁRIOS DE PICO").bold(false).newline();

  if (peaksWithSales.length === 0) {
    encoder.text("Nenhuma venda neste período.").newline();
  } else {
    peaksWithSales.forEach((peak) => {
      encoder.table(columns, [[`${peak.hour} (${peak.orders} ped.)`, formatCurrency(peak.revenue)]]);
    });
  }

  encoder.newline(10).cut();

  return encoder.encode();
}
