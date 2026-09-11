"use client";

import { useState } from "react";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { Header } from "@/_components/ui/header";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/_components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import {
  Banknote,
  CreditCard,
  Download,
  Landmark,
  ListChecks,
  LucideIcon,
  Percent,
  Printer,
  QrCode,
  SquarePen,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { TPaymentMethod } from "../order/interface";
import { useGetReportData, useGetProductReportData, type CustomDateRange, type DateRange } from "./query/useGetReportData";
import { ReportReceipt } from "./_components/report-receipt";
import { HourlyBarChart } from "./_components/hourly-bar-chart";
import { formatCurrency } from "@/_lib/format-currency";
import { buildCsv, downloadCsv } from "@/_lib/csv";

interface CardDetail {
  title: string;
  value: string;
  Icon: LucideIcon;
}

const dateRangeLabels: Record<DateRange, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
  custom: "Personalizado",
};

const paymentMethodLabels: Record<TPaymentMethod, { label: string; Icon: LucideIcon }> = {
  CASH: { label: "Dinheiro", Icon: Banknote },
  CREDIT: { label: "Crédito", Icon: CreditCard },
  DEBIT: { label: "Débito", Icon: Landmark },
  PIX: { label: "Pix", Icon: QrCode },
};

export default function ReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>("day");
  const [customRange, setCustomRange] = useState<CustomDateRange>({ start: "", end: "" });
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [closingOperator, setClosingOperator] = useState("ALL");
  const [countedCash, setCountedCash] = useState("");
  const hasCustomRange = Boolean(customRange.start && customRange.end);
  const { data: reportData, isLoading } = useGetReportData(dateRange, customRange);
  const { data: productReportData } = useGetProductReportData(dateRange, selectedProduct, customRange);

  if (isLoading || !reportData) {
    return (
      <section className="flex flex-col h-screen">
        <div className="p-4">
          <Header title="Relatório" description="Carregando relatório de vendas..." />
        </div>
        <Separator className="h-px w-full" />
        <div className="p-4 text-center">Carregando dados...</div>
      </section>
    );
  }

  const productMaxHourlyRevenue = productReportData ? Math.max(...productReportData.hourlyPeaks.map((p) => p.revenue)) : 0;

  const closingStats =
    closingOperator === "ALL"
      ? {
          ordersCount: reportData.ordersCount,
          totalRevenue: reportData.totalRevenue,
          paymentMethodStats: reportData.paymentMethodStats,
        }
      : (reportData.operatorStats.find((stat) => stat.operatorName === closingOperator) ?? {
          ordersCount: 0,
          totalRevenue: 0,
          paymentMethodStats: reportData.paymentMethodStats.map((stat) => ({ ...stat, count: 0, total: 0 })),
        });

  const expectedCash = closingStats.paymentMethodStats.find((stat) => stat.method === "CASH")?.total ?? 0;
  const cashDifference = countedCash ? (Number(countedCash) || 0) - expectedCash : null;

  const activeRangeLabel =
    dateRange === "custom" && hasCustomRange
      ? `${new Date(`${customRange.start}T00:00:00`).toLocaleDateString("pt-BR")} a ${new Date(`${customRange.end}T00:00:00`).toLocaleDateString("pt-BR")}`
      : dateRangeLabels[dateRange];

  function handleExportCsv() {
    if (!reportData) {
      return;
    }

    const summarySection = buildCsv(
      ["Métrica", "Valor"],
      [
        ["Total de Vendas", formatCurrency(reportData.totalRevenue)],
        ["Pedidos", reportData.ordersCount],
        ["Ticket Médio", formatCurrency(reportData.averageTicket)],
        ["Itens Vendidos", reportData.totalItemsSold],
        ["CMV", formatCurrency(reportData.totalCost)],
        ["Lucro Bruto", formatCurrency(reportData.grossProfit)],
        ["Margem Bruta", `${reportData.grossMarginPercent.toFixed(1)}%`],
      ],
    );

    const productsSection = buildCsv(
      ["Produto", "Quantidade Vendida", "Faturamento", "Custo", "CMV %", "Lucro", "Margem"],
      reportData.allProducts.map((product) => [
        product.name,
        product.quantity,
        formatCurrency(product.revenue),
        formatCurrency(product.cost),
        `${product.cmvPercent.toFixed(1)}%`,
        formatCurrency(product.profit),
        `${product.marginPercent.toFixed(1)}%`,
      ]),
    );

    const paymentSection = buildCsv(
      ["Forma de Pagamento", "Pedidos", "Total"],
      reportData.paymentMethodStats.map((stat) => [paymentMethodLabels[stat.method].label, stat.count, formatCurrency(stat.total)]),
    );

    const closingSection = buildCsv(
      ["Operador", "Forma de Pagamento", "Pedidos", "Total"],
      reportData.operatorStats.flatMap((operatorStat) =>
        operatorStat.paymentMethodStats.map((stat) => [
          operatorStat.operatorName,
          paymentMethodLabels[stat.method].label,
          stat.count,
          formatCurrency(stat.total),
        ]),
      ),
    );

    const csv = [summarySection, "", productsSection, "", paymentSection, "", closingSection].join("\n");

    const fileRangeLabel = dateRange === "custom" && hasCustomRange ? `${customRange.start}_a_${customRange.end}` : dateRange;

    downloadCsv(`brewdesk-relatorio-${fileRangeLabel}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  const cardDetails: CardDetail[] = [
    {
      title: "Total de Vendas",
      value: formatCurrency(reportData.totalRevenue),
      Icon: Wallet,
    },
    {
      title: "Pedidos",
      value: reportData.ordersCount.toString(),
      Icon: SquarePen,
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(reportData.averageTicket),
      Icon: Wallet,
    },
    {
      title: "Itens Vendidos",
      value: reportData.totalItemsSold.toString(),
      Icon: ListChecks,
    },
  ];

  return (
    <>
      <ReportReceipt
        dateRangeLabel={activeRangeLabel}
        reportData={reportData}
        selectedProduct={selectedProduct}
        productReportData={productReportData}
      />

      <section className="flex flex-col h-screen print:hidden">
        <div className="p-4 flex items-center justify-between flex-wrap gap-2">
          <Header title="Relatório" />

          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={handleExportCsv}>
              <Download />
              Exportar CSV
            </Button>

            <Button size="lg" onClick={() => window.print()}>
              <Printer />
              Imprimir relatório
            </Button>
          </div>
        </div>

        <Separator className="h-px w-full" />

        <Tabs
          value={dateRange}
          onValueChange={(value) => setDateRange(value as DateRange)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="p-4 pb-0 w-full">
            <TabsList className="rounded-md bg-muted p-2 flex gap-6 justify-end">
              {(Object.entries(dateRangeLabels) as Array<[DateRange, string]>).map(([key, label]) => (
                <TabsTrigger key={key} value={key}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {(Object.keys(dateRangeLabels) as DateRange[]).map((range) => (
            <TabsContent key={range} value={range} className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-4">
              {range === "custom" && (
                <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">De</label>
                    <Input
                      type="date"
                      value={customRange.start}
                      onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Até</label>
                    <Input
                      type="date"
                      value={customRange.end}
                      onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {range === "custom" && !hasCustomRange ? (
                <p className="text-center text-muted-foreground text-sm py-12">Selecione as duas datas pra ver o relatório.</p>
              ) : (
                <>
                <div className="flex gap-4 w-full mb-4 flex-wrap">
                  {cardDetails.map((cardDetail) => (
                    <Card key={cardDetail.title} className="flex-1 min-w-50">
                      <CardContent className="flex flex-col gap-4">
                        <div className="flex justify-between items-center gap-4">
                          <p className="font-medium text-sm">{cardDetail.title}</p>
                          <cardDetail.Icon size={16} />
                        </div>
                        <p className="text-lg font-semibold">{cardDetail.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-4 w-full mb-4 flex-wrap">
                  <Card className="flex-1 min-w-50">
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex justify-between items-center gap-4">
                        <p className="font-medium text-sm">CMV</p>
                        <Wallet size={16} />
                      </div>
                      <p className="text-lg font-semibold">{formatCurrency(reportData.totalCost)}</p>
                    </CardContent>
                  </Card>

                  <Card className="flex-1 min-w-50">
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex justify-between items-center gap-4">
                        <p className="font-medium text-sm">Lucro Bruto</p>
                        <TrendingUp size={16} />
                      </div>
                      <p className="text-lg font-semibold">{formatCurrency(reportData.grossProfit)}</p>
                    </CardContent>
                  </Card>

                  <Card className="flex-1 min-w-50">
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex justify-between items-center gap-4">
                        <p className="font-medium text-sm">Margem Bruta</p>
                        <Percent size={16} />
                      </div>
                      <p className="text-lg font-semibold">{reportData.grossMarginPercent.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-4">
                  <Card>
                    <CardContent className="flex flex-col gap-4 pt-4">
                      <div>
                        <p className="font-medium">Custo e Margem por Produto</p>
                        <p className="text-xs text-muted-foreground">
                          CMV % = quanto do preço de venda foi consumido pelo custo — quanto menor, melhor o preço
                        </p>
                      </div>

                      <div className="space-y-2">
                        {reportData.allProducts.length > 0 ? (
                          reportData.allProducts.map((product) => (
                            <div
                              key={product.name}
                              className="flex justify-between items-center p-2 bg-muted rounded-md gap-4"
                            >
                              <span className="font-medium text-sm">{product.name}</span>

                              <div className="flex gap-4 text-right">
                                <div>
                                  <p className="text-sm font-semibold">{formatCurrency(product.cost)}</p>
                                  <p className="text-xs text-muted-foreground">custo</p>
                                </div>
                                <div>
                                  <p
                                    className={`text-sm font-semibold ${product.cmvPercent > 50 ? "text-destructive" : ""}`}
                                  >
                                    {product.cmvPercent.toFixed(0)}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">CMV %</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{formatCurrency(product.profit)}</p>
                                  <p className="text-xs text-muted-foreground">lucro</p>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{product.marginPercent.toFixed(0)}%</p>
                                  <p className="text-xs text-muted-foreground">margem</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground text-sm py-4">Nenhuma venda neste período</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-4">
                  <Card>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="font-medium">Consulta por Produto</p>
                          <p className="text-xs text-muted-foreground">Vendas de um item específico no período selecionado</p>
                        </div>
                        <Select value={selectedProduct || ""} onValueChange={(value) => setSelectedProduct(value || null)}>
                          <SelectTrigger className="w-full sm:w-60">
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos os produtos</SelectItem>
                            {reportData?.allProducts.map((product) => (
                              <SelectItem key={product.name} value={product.name}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedProduct && productReportData && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col p-2 bg-muted rounded-md">
                            <p className="text-xs text-muted-foreground">Quantidade Vendida</p>
                            <p className="text-lg font-semibold">{productReportData.totalItemsSold}</p>
                          </div>
                          <div className="flex flex-col p-2 bg-muted rounded-md">
                            <p className="text-xs text-muted-foreground">Faturamento</p>
                            <p className="text-lg font-semibold">{formatCurrency(productReportData.totalRevenue)}</p>
                          </div>
                        </div>
                      )}

                      {selectedProduct && productReportData && (
                        <div className="mb-4">
                          <Card>
                            <CardContent className="flex flex-col gap-4 pt-4">
                              <div>
                                <p className="font-medium">Horários de Pico - {selectedProduct}</p>
                                <p className="text-xs text-muted-foreground">Vendas por hora deste produto</p>
                              </div>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {productReportData.hourlyPeaks
                                  .filter((peak) => peak.orders > 0)
                                  .sort((a, b) => b.revenue - a.revenue)
                                  .map((peak) => {
                                    const percentage =
                                      productMaxHourlyRevenue > 0 ? (peak.revenue / productMaxHourlyRevenue) * 100 : 0;
                                    return (
                                      <div key={peak.hour} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                          <span className="font-medium text-sm">{peak.hour}</span>
                                          <div className="flex gap-2 text-right">
                                            <span className="text-sm">{peak.orders} ped.</span>
                                            <span className="text-sm font-semibold">{formatCurrency(peak.revenue)}</span>
                                          </div>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                          <div
                                            className="h-full bg-foreground/70 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                {productReportData.hourlyPeaks.filter((peak) => peak.orders > 0).length === 0 && (
                                  <p className="text-center text-muted-foreground text-sm py-4">
                                    Nenhuma venda deste produto neste período
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-4">
                  <Card>
                    <CardContent className="flex flex-col gap-4 pt-4">
                      <p className="font-medium">Formas de Pagamento</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {reportData.paymentMethodStats.map(({ method, count, total }) => {
                          const { label, Icon } = paymentMethodLabels[method];

                          return (
                            <div key={method} className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <div className="flex items-center gap-2">
                                <Icon size={16} />
                                <span className="text-sm font-medium">{label}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">{formatCurrency(total)}</p>
                                <p className="text-xs text-muted-foreground">{count} pedido(s)</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-4">
                  <Card>
                    <CardContent className="flex flex-col gap-4 pt-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="font-medium">Fechamento de Caixa</p>
                          <p className="text-xs text-muted-foreground">
                            Confira o valor recebido por operador e forma de pagamento no período selecionado
                          </p>
                        </div>

                        <Select value={closingOperator} onValueChange={setClosingOperator}>
                          <SelectTrigger className="w-full sm:w-60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Todos os operadores</SelectItem>
                            {reportData.operatorStats.map((stat) => (
                              <SelectItem key={stat.operatorName} value={stat.operatorName}>
                                {stat.operatorName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {closingStats.paymentMethodStats.map(({ method, count, total }) => {
                          const { label, Icon } = paymentMethodLabels[method];

                          return (
                            <div key={method} className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <div className="flex items-center gap-2">
                                <Icon size={16} />
                                <span className="text-sm font-medium">{label}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">{formatCurrency(total)}</p>
                                <p className="text-xs text-muted-foreground">{count} pedido(s)</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <span className="text-sm font-medium">Total do período</span>
                        <span className="text-base font-bold">{formatCurrency(closingStats.totalRevenue)}</span>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Conferência de dinheiro em espécie</p>

                        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Esperado (vendas em dinheiro)</p>
                            <p className="text-sm font-semibold">{formatCurrency(expectedCash)}</p>
                          </div>

                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Contado na gaveta</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0,00"
                              value={countedCash}
                              onChange={(e) => setCountedCash(e.target.value)}
                            />
                          </div>
                        </div>

                        {cashDifference !== null && (
                          <p
                            className={`text-sm font-medium ${
                              cashDifference === 0 ? "text-muted-foreground" : cashDifference < 0 ? "text-destructive" : "text-foreground"
                            }`}
                          >
                            {cashDifference === 0
                              ? "Confere certinho."
                              : cashDifference < 0
                                ? `Faltam ${formatCurrency(Math.abs(cashDifference))}`
                                : `Sobram ${formatCurrency(cashDifference)}`}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col md:flex-row w-full gap-4 mb-4">
                  <div className="mb-4 w-full">
                    <Card>
                      <CardContent className="flex flex-col gap-4 pt-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={18} />
                          <p className="font-medium">Produtos Mais Vendidos</p>
                        </div>
                        <div className="space-y-2">
                          {reportData.topProducts.length > 0 ? (
                            reportData.topProducts.map((product, index) => (
                              <div
                                key={product.name}
                                className="flex justify-between items-center p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="text-xs">
                                    #{index + 1}
                                  </Badge>
                                  <span className="font-medium text-sm">{product.name}</span>
                                </div>
                                <div className="flex gap-4">
                                  <div className="text-right">
                                    <p className="text-sm font-semibold">{product.quantity}</p>
                                    <p className="text-xs text-muted-foreground">unidades</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
                                    <p className="text-xs text-muted-foreground">faturamento</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-muted-foreground text-sm py-4">Nenhuma venda neste período</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mb-4 w-full">
                    <Card>
                      <CardContent className="flex flex-col gap-4 pt-4">
                        <div className="flex items-center gap-2">
                          <TrendingDown size={18} />
                          <p className="font-medium">Produtos Menos Vendidos</p>
                        </div>
                        <div className="space-y-2">
                          {reportData.bottomProducts.length > 0 ? (
                            reportData.bottomProducts.map((product, index) => (
                              <div
                                key={product.name}
                                className="flex justify-between items-center p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="text-xs">
                                    {reportData.bottomProducts.length - index}º
                                  </Badge>
                                  <span className="font-medium text-sm">{product.name}</span>
                                </div>
                                <div className="flex gap-4">
                                  <div className="text-right">
                                    <p className="text-sm font-semibold">{product.quantity}</p>
                                    <p className="text-xs text-muted-foreground">unidades</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
                                    <p className="text-xs text-muted-foreground">faturamento</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-muted-foreground text-sm py-4">Nenhuma venda neste período</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <Card>
                    <CardContent className="flex flex-col gap-4 pt-4">
                      <div>
                        <p className="font-medium">Horários de Pico</p>
                        <p className="text-xs text-muted-foreground">Faturamento por hora do dia</p>
                      </div>

                      <HourlyBarChart data={reportData.hourlyPeaks} />
                    </CardContent>
                  </Card>
                </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </>
  );
}
