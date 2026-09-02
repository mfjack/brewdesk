import { useQuery } from "@tanstack/react-query";
import { localStore } from "@/_lib/local-store";
import { TOrderResponse } from "@/app/order/interface";

type DateRange = "day" | "week" | "month";

interface ReportStats {
  totalRevenue: number;
  ordersCount: number;
  averageTicket: number;
  totalItemsSold: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  bottomProducts: Array<{ name: string; quantity: number; revenue: number }>;
  hourlyPeaks: Array<{ hour: string; revenue: number; orders: number }>;
  allProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

function getDateRange(dateRange: DateRange): { start: Date; end: Date } {
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

function filterOrdersByDateRange(orders: TOrderResponse[], dateRange: DateRange): TOrderResponse[] {
  const { start, end } = getDateRange(dateRange);
  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= start && orderDate <= end && order.status !== "OPEN";
  });
}

function calculateReportStats(orders: TOrderResponse[]): ReportStats {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const ordersCount = orders.length;
  const averageTicket = ordersCount > 0 ? totalRevenue / ordersCount : 0;

  // Calculate items sold
  const productSalesMap = new Map<string, { quantity: number; revenue: number }>();
  let totalItemsSold = 0;

  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      totalItemsSold += item.quantity;
      const productKey = item.product.name;
      const current = productSalesMap.get(productKey) || { quantity: 0, revenue: 0 };
      productSalesMap.set(productKey, {
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + item.subtotal,
      });
    });
  });

  // Top and bottom products
  const sortedProducts = Array.from(productSalesMap.entries())
    .map(([name, stats]) => ({
      name,
      quantity: stats.quantity,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity);

  const topProducts = sortedProducts.slice(0, 5);
  const bottomProducts = sortedProducts.slice(-5).reverse();

  // Hourly peaks
  const hourlyMap = new Map<number, { revenue: number; orders: number }>();
  orders.forEach((order) => {
    const hour = new Date(order.createdAt).getHours();
    const current = hourlyMap.get(hour) || { revenue: 0, orders: 0 };
    hourlyMap.set(hour, {
      revenue: current.revenue + order.total,
      orders: current.orders + 1,
    });
  });

  const hourlyPeaks: Array<{ hour: string; revenue: number; orders: number }> = [];
  for (let i = 0; i < 24; i++) {
    const stats = hourlyMap.get(i) || { revenue: 0, orders: 0 };
    hourlyPeaks.push({
      hour: `${String(i).padStart(2, "0")}:00`,
      revenue: stats.revenue,
      orders: stats.orders,
    });
  }

  return {
    totalRevenue,
    ordersCount,
    averageTicket,
    totalItemsSold,
    topProducts,
    bottomProducts,
    hourlyPeaks,
    allProducts: sortedProducts,
  };
}

export function useGetReportData(dateRange: DateRange = "day") {
  return useQuery({
    queryKey: ["report", dateRange],
    queryFn: () => {
      const allOrders = localStore.getOrders();
      const filteredOrders = filterOrdersByDateRange(allOrders, dateRange);
      return calculateReportStats(filteredOrders);
    },
  });
}

export function useGetProductReportData(dateRange: DateRange = "day", productName: string | null) {
  return useQuery({
    queryKey: ["report", dateRange, "product", productName],
    queryFn: () => {
      if (!productName) return null;

      const allOrders = localStore.getOrders();
      const filteredOrders = filterOrdersByDateRange(allOrders, dateRange);

      // Filter orders to only include items with the selected product
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

      // Hourly peaks for this product
      const hourlyMap = new Map<number, { revenue: number; orders: number }>();
      productOrders.forEach((order) => {
        const hour = new Date(order.createdAt).getHours();
        const orderRevenue = order.orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        const current = hourlyMap.get(hour) || { revenue: 0, orders: 0 };
        hourlyMap.set(hour, {
          revenue: current.revenue + orderRevenue,
          orders: current.orders + 1,
        });
      });

      const hourlyPeaks: Array<{ hour: string; revenue: number; orders: number }> = [];
      for (let i = 0; i < 24; i++) {
        const stats = hourlyMap.get(i) || { revenue: 0, orders: 0 };
        hourlyPeaks.push({
          hour: `${String(i).padStart(2, "0")}:00`,
          revenue: stats.revenue,
          orders: stats.orders,
        });
      }

      return {
        totalRevenue,
        ordersCount,
        averageTicket,
        totalItemsSold,
        topProducts: [],
        bottomProducts: [],
        hourlyPeaks,
        allProducts: [],
      };
    },
    enabled: !!productName,
  });
}
