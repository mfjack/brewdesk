import type { TOrderResponse } from "@/app/(app)/order/interface";

export function isContaOrder(order: TOrderResponse): boolean {
  return order.status === "PAID" && order.payments.some((payment) => payment.method === "CONTA");
}

export function isContaUnsettled(order: TOrderResponse): boolean {
  return isContaOrder(order) && !order.contaSettledAt;
}

export function findOpenContaOrders(orders: TOrderResponse[], customerName: string): TOrderResponse[] {
  const key = customerName.trim().toLowerCase();

  if (!key) {
    return [];
  }

  return orders
    .filter((order) => isContaUnsettled(order) && order.customerName.trim().toLowerCase() === key)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function listOpenContaOrders(orders: TOrderResponse[]): TOrderResponse[] {
  return orders.filter(isContaUnsettled).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
