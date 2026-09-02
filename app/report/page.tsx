"use client";

import { useState } from "react";
import { Badge } from "@/_components/ui/badge";
import { Card, CardContent } from "@/_components/ui/card";
import { Header } from "@/_components/ui/header";
import { Separator } from "@/_components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/_components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import { ListChecks, LucideIcon, SquarePen, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useGetReportData, useGetProductReportData } from "./query/useGetReportData";
import { formatCurrency } from "@/_lib/format-currency";

interface CardDetail {
  title: string;
  value: string;
  Icon: LucideIcon;
}

type DateRange = "day" | "week" | "month";

const dateRangeLabels: Record<DateRange, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
};

export default function ReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>("day");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const { data: reportData, isLoading } = useGetReportData(dateRange);
  const { data: productReportData } = useGetProductReportData(dateRange, selectedProduct);

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
    <section className="flex flex-col h-screen">
      <div className="p-4">
        <Header title="Relatório" description="Relatório de vendas por período" />
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
            {/* Cards de Estatísticas */}
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

            {/* Consulta por Produto */}
            <div className="mb-4">
              <Card>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Consulta por Produto</p>
                      <p className="text-xs text-muted-foreground">Vendas de um item específico no período selecionado</p>
                    </div>
                    <Select value={selectedProduct || ""} onValueChange={(value) => setSelectedProduct(value || null)}>
                      <SelectTrigger className="w-60">
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
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(productReportData.totalRevenue)}</p>
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
                                const maxRevenue = Math.max(...productReportData.hourlyPeaks.map((p) => p.revenue));
                                const percentage = maxRevenue > 0 ? (peak.revenue / maxRevenue) * 100 : 0;
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
                                        className="h-full bg-linear-to-r from-purple-400 to-purple-600 rounded-full transition-all"
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

            <div className="flex w-full gap-4 mb-4">
              <div className="mb-4 w-full">
                <Card>
                  <CardContent className="flex flex-col gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={18} className="text-green-500" />
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
                                <p className="text-sm font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
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

              {/* Produtos Menos Vendidos */}
              <div className="mb-4 w-full">
                <Card>
                  <CardContent className="flex flex-col gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={18} className="text-red-500" />
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
                                <p className="text-sm font-semibold text-red-600">{formatCurrency(product.revenue)}</p>
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

            {/* Horários de Pico */}
            <div>
              <Card>
                <CardContent className="flex flex-col gap-4 pt-4">
                  <div>
                    <p className="font-medium">Horários de Pico</p>
                    <p className="text-xs text-muted-foreground">Faturamento e quantidade de pedidos por hora</p>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {reportData.hourlyPeaks
                      .filter((peak) => peak.orders > 0)
                      .sort((a, b) => b.revenue - a.revenue)
                      .map((peak) => {
                        const maxRevenue = Math.max(...reportData.hourlyPeaks.map((p) => p.revenue));
                        const percentage = maxRevenue > 0 ? (peak.revenue / maxRevenue) * 100 : 0;
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
                                className="h-full bg-linear-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    {reportData.hourlyPeaks.filter((peak) => peak.orders > 0).length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">Nenhuma venda neste período</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
