import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/store";
import { TOrderResponse, TPaymentMethod } from "@/app/order/interface";

export type DateRange = "day" | "week" | "month" | "custom";

export interface CustomDateRange {
  start: string;
  end: string;
}

export interface ProductStat {
  name: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  cmvPercent: number;
}

export interface HourlyPeak {
  hour: string;
  revenue: number;
  orders: number;
}

export interface PaymentMethodStat {
  method: TPaymentMethod;
  count: number;
  total: number;
}

export interface OperatorStat {
  operatorName: string;
  ordersCount: number;
  totalRevenue: number;
  paymentMethodStats: PaymentMethodStat[];
}

export interface ReportStats {
  totalRevenue: number;
  ordersCount: number;
  averageTicket: number;
  totalItemsSold: number;
  topProducts: ProductStat[];
  bottomProducts: ProductStat[];
  hourlyPeaks: HourlyPeak[];
  allProducts: ProductStat[];
  paymentMethodStats: PaymentMethodStat[];
  operatorStats: OperatorStat[];
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
}

export interface ProductReportStats {
  totalRevenue: number;
  ordersCount: number;
  averageTicket: number;
  totalItemsSold: number;
  hourlyPeaks: HourlyPeak[];
}

function getDateRange(dateRange: DateRange, customRange?: CustomDateRange): { start: Date; end: Date } | null {
  if (dateRange === "custom") {
    if (!customRange?.start || !customRange?.end) {
      return null;
    }

    const start = new Date(`${customRange.start}T00:00:00`);
    const end = new Date(`${customRange.end}T23:59:59.999`);

    return start <= end ? { start, end } : { start: end, end: start };
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (dateRange === "week") {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
  } else if (dateRange === "month") {
    start.setDate(1);
  }

  return { start, end };
}

function filterOrdersByDateRange(orders: TOrderResponse[], dateRange: DateRange, customRange?: CustomDateRange): TOrderResponse[] {
  const range = getDateRange(dateRange, customRange);

  if (!range) {
    return [];
  }

  const { start, end } = range;

  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= start && orderDate <= end && order.status === "PAID";
  });
}

function buildPaymentMethodStats(orders: TOrderResponse[]): PaymentMethodStat[] {
  const methods: TPaymentMethod[] = ["CASH", "CREDIT", "DEBIT", "PIX"];

  return methods.map((method) => {
    const ordersWithMethod = orders.filter((order) => order.paymentMethod === method);

    return {
      method,
      count: ordersWithMethod.length,
      total: ordersWithMethod.reduce((sum, order) => sum + order.total, 0),
    };
  });
}

function buildOperatorStats(orders: TOrderResponse[]): OperatorStat[] {
  const operatorNames = Array.from(new Set(orders.map((order) => order.operatorName || "Sem operador")));

  return operatorNames
    .map((operatorName) => {
      const operatorOrders = orders.filter((order) => (order.operatorName || "Sem operador") === operatorName);

      return {
        operatorName,
        ordersCount: operatorOrders.length,
        totalRevenue: operatorOrders.reduce((sum, order) => sum + order.total, 0),
        paymentMethodStats: buildPaymentMethodStats(operatorOrders),
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

function buildHourlyPeaks(orders: TOrderResponse[], getRevenue: (order: TOrderResponse) => number): HourlyPeak[] {
  const hourlyMap = new Map<number, { revenue: number; orders: number }>();

  orders.forEach((order) => {
    const hour = new Date(order.createdAt).getHours();
    const current = hourlyMap.get(hour) || { revenue: 0, orders: 0 };
    hourlyMap.set(hour, {
      revenue: current.revenue + getRevenue(order),
      orders: current.orders + 1,
    });
  });

  const hourlyPeaks: HourlyPeak[] = [];
  for (let i = 0; i < 24; i++) {
    const stats = hourlyMap.get(i) || { revenue: 0, orders: 0 };
    hourlyPeaks.push({
      hour: `${String(i).padStart(2, "0")}:00`,
      revenue: stats.revenue,
      orders: stats.orders,
    });
  }

  return hourlyPeaks;
}

function calculateReportStats(orders: TOrderResponse[]): ReportStats {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const ordersCount = orders.length;
  const averageTicket = ordersCount > 0 ? totalRevenue / ordersCount : 0;

  const productSalesMap = new Map<string, { quantity: number; revenue: number; cost: number }>();
  let totalItemsSold = 0;
  let totalCost = 0;

  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      totalItemsSold += item.quantity;

      const itemCost = item.quantity * (item.costPrice ?? 0);
      totalCost += itemCost;

      const productKey = item.product.name;
      const current = productSalesMap.get(productKey) || { quantity: 0, revenue: 0, cost: 0 };
      productSalesMap.set(productKey, {
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + item.subtotal,
        cost: current.cost + itemCost,
      });
    });
  });

  const sortedProducts = Array.from(productSalesMap.entries())
    .map(([name, stats]) => ({
      name,
      quantity: stats.quantity,
      revenue: stats.revenue,
      cost: stats.cost,
      profit: stats.revenue - stats.cost,
      marginPercent: stats.revenue > 0 ? ((stats.revenue - stats.cost) / stats.revenue) * 100 : 0,
      cmvPercent: stats.revenue > 0 ? (stats.cost / stats.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.quantity - a.quantity);

  const topProducts = sortedProducts.slice(0, 5);
  const bottomProducts = sortedProducts.slice(-5).reverse();

  const hourlyPeaks = buildHourlyPeaks(orders, (order) => order.total);

  const grossProfit = totalRevenue - totalCost;
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    ordersCount,
    averageTicket,
    totalItemsSold,
    topProducts,
    bottomProducts,
    hourlyPeaks,
    allProducts: sortedProducts,
    paymentMethodStats: buildPaymentMethodStats(orders),
    operatorStats: buildOperatorStats(orders),
    totalCost,
    grossProfit,
    grossMarginPercent,
  };
}

export function useGetReportData(dateRange: DateRange = "day", customRange?: CustomDateRange) {
  return useQuery({
    queryKey: ["report", dateRange, customRange],
    queryFn: () => {
      const allOrders = localStore.getOrders();
      const filteredOrders = filterOrdersByDateRange(allOrders, dateRange, customRange);
      return calculateReportStats(filteredOrders);
    },
  });
}

export function useGetProductReportData(
  dateRange: DateRange = "day",
  productName: string | null,
  customRange?: CustomDateRange,
) {
  return useQuery({
    queryKey: ["report", dateRange, customRange, "product", productName],
    queryFn: (): ProductReportStats | null => {
      if (!productName) return null;

      const allOrders = localStore.getOrders();
      const filteredOrders = filterOrdersByDateRange(allOrders, dateRange, customRange);

      const productOrders = filteredOrders
        .map((order) => ({
          ...order,
          orderItems: order.orderItems.filter((item) => item.product.name === productName),
        }))
        .filter((order) => order.orderItems.length > 0);

      const totalRevenue = productOrders.reduce(
        (sum, order) => sum + order.orderItems.reduce((itemSum, item) => itemSum + item.subtotal, 0),
        0,
      );
      const totalItemsSold = productOrders.reduce(
        (sum, order) => sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      );
      const ordersCount = productOrders.length;
      const averageTicket = ordersCount > 0 ? totalRevenue / ordersCount : 0;

      const hourlyPeaks = buildHourlyPeaks(productOrders, (order) => order.orderItems.reduce((sum, item) => sum + item.subtotal, 0));

      return {
        totalRevenue,
        ordersCount,
        averageTicket,
        totalItemsSold,
        hourlyPeaks,
      };
    },
    enabled: !!productName,
  });
}
