"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/_lib/format-currency";
import type { HourlyPeak } from "../query/useGetReportData";

interface THourlyBarChart {
  data: HourlyPeak[];
}

interface TChartTooltip {
  active?: boolean;
  payload?: { payload: HourlyPeak }[];
}

function ChartTooltip({ active, payload }: TChartTooltip) {
  if (!active || !payload?.length) {
    return null;
  }

  const peak = payload[0].payload;

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{peak.hour}</p>
      <p className="text-muted-foreground">{peak.orders} pedido(s)</p>
      <p className="font-medium">{formatCurrency(peak.revenue)}</p>
    </div>
  );
}

export function HourlyBarChart({ data }: THourlyBarChart) {
  const peaks = data.filter((peak) => peak.orders > 0);

  if (peaks.length === 0) {
    return <p className="text-center text-muted-foreground text-sm py-12">Nenhuma venda neste período</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={peaks} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="var(--border)" />

        <XAxis
          dataKey="hour"
          tickFormatter={(hour: string) => hour.slice(0, 2)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />

        <YAxis
          tickFormatter={(value: number) => formatCurrency(value)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />

        <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip />} />

        <Bar dataKey="revenue" fill="var(--foreground)" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
