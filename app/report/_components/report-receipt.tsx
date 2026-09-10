import { formatCurrency } from "@/_lib/format-currency";
import { ProductReportStats, ProductStat, ReportStats } from "../query/useGetReportData";

interface TReportReceipt {
  dateRangeLabel: string;
  reportData: ReportStats;
  selectedProduct: string | null;
  productReportData: ProductReportStats | null | undefined;
}

function ProductTable({ title, products }: { title: string; products: ProductStat[] }) {
  return (
    <div className="mb-4">
      <h2 className="text-xs font-bold border-b pb-1 mb-1">{title}</h2>

      {products.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma venda neste período.</p>
      ) : (
        <table className="w-full text-xs">
          <tbody>
            {products.map((product) => (
              <tr key={product.name}>
                <td className="py-0.5">{product.name}</td>
                <td className="py-0.5 text-right whitespace-nowrap">{product.quantity} un.</td>
                <td className="py-0.5 text-right whitespace-nowrap">{formatCurrency(product.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function ReportReceipt({ dateRangeLabel, reportData, selectedProduct, productReportData }: TReportReceipt) {
  const peaksWithSales = reportData.hourlyPeaks.filter((peak) => peak.orders > 0).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="report-receipt hidden px-6 print:block">
      <h1 className="text-sm font-bold text-center mt-6">Mañana Café y Coisinhas</h1>

      <p className="text-center text-sm text-muted-foreground mb-1 mt-2">Relatório de Vendas — {dateRangeLabel}</p>

      <p className="text-center text-xs text-muted-foreground border-b pb-2 mb-4">
        Gerado em {new Date().toLocaleString("pt-BR")}
      </p>

      <div className="grid grid-cols-4 gap-2 border-b pb-3 mb-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Total de Vendas</p>
          <p className="text-xs font-bold">{formatCurrency(reportData.totalRevenue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pedidos</p>
          <p className="text-xs font-bold">{reportData.ordersCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ticket Médio</p>
          <p className="text-xs font-bold">{formatCurrency(reportData.averageTicket)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Itens Vendidos</p>
          <p className="text-sm font-bold">{reportData.totalItemsSold}</p>
        </div>
      </div>

      {selectedProduct && productReportData && (
        <div className="mb-4">
          <h2 className="text-sm font-bold border-b pb-1 mb-1">Consulta por produto — {selectedProduct}</h2>

          <p className="text-xs">Quantidade vendida: {productReportData.totalItemsSold}</p>
          <p className="text-xs">Faturamento: {formatCurrency(productReportData.totalRevenue)}</p>
        </div>
      )}

      <ProductTable title="Produtos Mais Vendidos" products={reportData.topProducts} />

      <ProductTable title="Produtos Menos Vendidos" products={reportData.bottomProducts} />

      <div>
        <h2 className="text-xs font-bold border-b pb-1 mb-1">Horários de Pico</h2>

        {peaksWithSales.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma venda neste período.</p>
        ) : (
          <table className="w-full text-xs">
            <tbody>
              {peaksWithSales.map((peak) => (
                <tr key={peak.hour}>
                  <td className="py-0.5">{peak.hour}</td>
                  <td className="py-0.5 text-right whitespace-nowrap">{peak.orders} ped.</td>
                  <td className="py-0.5 text-right whitespace-nowrap">{formatCurrency(peak.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
