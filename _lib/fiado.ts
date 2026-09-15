import type { TOrderResponse } from "@/app/(app)/order/interface";

export function isFiadoOrder(order: TOrderResponse): boolean {
  return order.status === "PAID" && order.payments.some((payment) => payment.method === "FIADO");
}

export function isFiadoUnsettled(order: TOrderResponse): boolean {
  return isFiadoOrder(order) && !order.fiadoSettledAt;
}

export function findOpenFiadoOrders(orders: TOrderResponse[], customerName: string): TOrderResponse[] {
  const key = customerName.trim().toLowerCase();

  if (!key) {
    return [];
  }

  return orders
    .filter((order) => isFiadoUnsettled(order) && order.customerName.trim().toLowerCase() === key)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function listOpenFiadoOrders(orders: TOrderResponse[]): TOrderResponse[] {
  return orders.filter(isFiadoUnsettled).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
