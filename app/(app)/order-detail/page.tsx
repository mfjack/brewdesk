"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { SearchInput } from "@/_components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import { Separator } from "@/_components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/_components/ui/tabs";
import { DollarSign, HandCoins, Printer, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useGetOrders } from "../order/query/useGetOrders";
import { TOrderPayment, TOrderResponse, TPaymentMethod } from "../order/interface";
import { buildOrderPayment, getChargedTakeoutFee, getGroupedOrders, isOrderPaid } from "../order/order-math";
import { paymentMethodLabels } from "../order/payment-methods";
import { PaymentDialog } from "../order/_components/payment-dialog";
import { GroupedOrdersBadge } from "../order/_components/grouped-orders-badge";
import { OrderReceipt } from "../order/_components/order-receipt";
import { buildReceiptBytes } from "@/_lib/receipt-encoder";
import { isThermalPrintingEnabled, printThermalReceipt } from "@/_lib/thermal-printer";
import { formatCurrency } from "@/_lib/format-currency";
import { Header } from "@/_components/ui/header";
import { useGetSettings } from "@/app/(app)/settings/query/useGetSettings";

import { useUpdateOrderStatus } from "../order/mutation/useUpdateOrderStatus";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { toTitleCase } from "@/_lib/to-title-case";
import { formatDateTime } from "@/_lib/format-date";
import { useIsHydrated } from "@/_lib/use-is-hydrated";

function toDateInputValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return localDate.toISOString().slice(0, 10);
}

export default function OrderDetailPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [historyOrder, setHistoryOrder] = useState<TOrderResponse | null>(null);
  const [printJob, setPrintJob] = useState<TOrderResponse | null>(null);

  const [paymentOrders, setPaymentOrders] = useState<TOrderResponse[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<TPaymentMethod>("CREDIT");
  const [amountReceived, setAmountReceived] = useState("");
  const [fiadoCustomerName, setFiadoCustomerName] = useState("");
  const [isSplitOpen, setIsSplitOpen] = useState(false);

  const [groupingOrder, setGroupingOrder] = useState<TOrderResponse | null>(null);
  const [groupWithSelection, setGroupWithSelection] = useState<string>("none");

  const { data: ordersData } = useGetOrders();
  const { data: settings } = useGetSettings();
  const isHydrated = useIsHydrated();
  const orders = useMemo(() => (isHydrated ? (ordersData ?? []) : []), [isHydrated, ordersData]);

  const updateOrderStatus = useUpdateOrderStatus();

  const openOrdersCount = useMemo(() => orders.filter((order) => !isOrderPaid(order)).length, [orders]);

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => !isOrderPaid(order))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter((order) => order.customerName.toLowerCase().includes(searchTerm.toLowerCase())),
    [orders, searchTerm],
  );

  const paidOrders = useMemo(
    () =>
      orders
        .filter((order) => isOrderPaid(order))
        .filter((order) => order.customerName.toLowerCase().includes(historySearchTerm.toLowerCase()))
        .filter((order) => !historyDate || toDateInputValue(new Date(order.createdAt)) === historyDate)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, historySearchTerm, historyDate],
  );

  function handleOpenPayment(order: TOrderResponse) {
    const groupedOrders = settings?.featureFlags.orderGrouping ? getGroupedOrders(order, orders) : [];

    setPaymentOrders([order, ...groupedOrders]);
    setPaymentMethod("CREDIT");
    setAmountReceived("");
    setFiadoCustomerName(order.customerName ?? "");
    setIsSplitOpen(false);
  }

  function handleOpenGrouping(order: TOrderResponse) {
    setGroupingOrder(order);
    setGroupWithSelection("none");
  }

  function handleCloseGrouping() {
    if (updateOrderStatus.isPending) {
      return;
    }

    setGroupingOrder(null);
  }

  const groupableTargets = useMemo(() => {
    if (!groupingOrder) {
      return [];
    }

    const alreadyGrouped = getGroupedOrders(groupingOrder, orders).map((order) => order.id);

    return orders
      .filter((order) => !isOrderPaid(order) && order.id !== groupingOrder.id && !alreadyGrouped.includes(order.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [groupingOrder, orders]);

  async function handleConfirmGrouping() {
    if (!groupingOrder || groupWithSelection === "none") {
      return;
    }

    await updateOrderStatus.mutateAsync({
      orderId: groupingOrder.id,
      status: groupingOrder.status === "OPEN" ? "PENDING" : groupingOrder.status,
      groupWithOrderId: Number(groupWithSelection),
    });

    setGroupingOrder(null);
    toast.success("Comandas vinculadas com sucesso!");
  }

  function handleClosePayment() {
    if (updateOrderStatus.isPending) {
      return;
    }

    setPaymentOrders([]);
  }

  const combinedPaymentTotal = paymentOrders.reduce((sum, order) => sum + order.total, 0);

  const combinedPaymentOrder: TOrderResponse | null =
    paymentOrders.length === 0
      ? null
      : {
          ...paymentOrders[0],
          customerName: paymentOrders.map((order) => order.customerName).join(" + "),
          isTakeout: false,
          total: combinedPaymentTotal,
          orderItems: paymentOrders.flatMap((order, orderIndex) =>
            order.orderItems.map((item) => ({ ...item, id: orderIndex * 10000 + item.id })),
          ),
        };

  async function handleConfirmPayment() {
    if (paymentOrders.length === 0 || (paymentMethod === "FIADO" && !fiadoCustomerName.trim())) {
      return;
    }

    // For a single order, amountReceived/changeDue is the real value the operator typed.
    // When paying two grouped orders together, that value only makes sense against the
    // combined total (already validated against it in the dialog) — each underlying
    // order still needs its own payment record to equal its own total, so it's stored
    // here as paid in full rather than trying to split the cash-in-hand across orders.
    const isCombinedPayment = paymentOrders.length > 1;

    await Promise.all(
      paymentOrders.map((order) =>
        updateOrderStatus.mutateAsync({
          orderId: order.id,
          status: "PAID",
          ...(paymentMethod === "FIADO" ? { customerName: fiadoCustomerName } : {}),
          payments: [
            buildOrderPayment(paymentMethod, order.total, isCombinedPayment ? order.total : Number(amountReceived) || 0),
          ],
        }),
      ),
    );

    setPaymentOrders([]);
    router.push("/order");
    toast.success("Pagamento confirmado com sucesso!");
  }

  async function handleConfirmSplitPayment(payments: TOrderPayment[]) {
    if (paymentOrders.length !== 1) {
      return;
    }

    await updateOrderStatus.mutateAsync({
      orderId: paymentOrders[0].id,
      status: "PAID",
      payments,
    });

    setPaymentOrders([]);
    router.push("/order");
    toast.success("Pagamento confirmado com sucesso!");
  }

  function handlePrintHistoryOrder(order: TOrderResponse) {
    setPrintJob(order);

    setTimeout(async () => {
      let printedViaThermal = false;

      if (isThermalPrintingEnabled()) {
        try {
          const bytes = buildReceiptBytes({ order, settings, printMode: "full" });

          if (bytes) {
            await printThermalReceipt(bytes);
          }

          printedViaThermal = true;
        } catch (error) {
          toast.error(
            `Não foi possível imprimir na impressora térmica${error instanceof Error ? ` (${error.message})` : ""}. Imprimindo pelo navegador.`,
          );
        }
      }

      if (!printedViaThermal) {
        window.print();
      } else {
        toast.success("Recibo impresso com sucesso!");
      }

      setPrintJob(null);
    }, 100);
  }

  return (
    <>
      {printJob && <OrderReceipt order={printJob} printMode="full" />}

      <section className="flex flex-col h-screen w-full print:hidden">
      <div className="flex flex-col p-4 w-full">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Header title="Comandas" />

          <Button asChild size="lg" className="w-30">
            <Link href="/order">
              <HandCoins />
              <p>PDV</p>
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="h-px bg-border" />

      <Tabs defaultValue="open" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-4">
          <TabsList className="rounded-md bg-muted p-2 flex gap-6 justify-start w-fit">
            <TabsTrigger value="open">Em Aberto</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="open" className="flex-1 flex flex-col overflow-hidden">
          {openOrdersCount > 0 && (
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Filtrar por nome do cliente..."
              className="p-4 w-full max-w-100"
            />
          )}

          {filteredOrders.length === 0 ? (
            <p className="p-12 text-sm text-center text-muted-foreground">
              {searchTerm ? "Nenhuma comanda encontrada com esse nome." : "Nenhuma comanda em aberto."}
            </p>
          ) : (
            <div className="flex-1 overflow-auto p-4 no-scrollbar">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredOrders.map((order: TOrderResponse) => {
                  const groupedOrders = settings?.featureFlags.orderGrouping ? getGroupedOrders(order, orders) : [];

                  return (
                    <Card className="flex flex-col gap-2 p-4 justify-between" key={order.id}>
                      <span className="font-bold text-lg text-center">{toTitleCase(order.customerName)}</span>

                      <GroupedOrdersBadge groupedOrders={groupedOrders} className="justify-center text-center" />

                      {order.observation && (
                        <p className="text-xs font-bold">
                          Observação:
                          <span className="text-xs font-medium text-muted-foreground"> {order.observation}</span>
                        </p>
                      )}

                      <Button asChild className="w-full mt-2" size="lg" variant="default">
                        <Link href={`/order?orderId=${order.id}`}>Detalhes da comanda</Link>
                      </Button>

                      {settings?.featureFlags.orderGrouping && (
                        <Button
                          type="button"
                          className="w-full"
                          size="lg"
                          variant="outline"
                          onClick={() => handleOpenGrouping(order)}
                        >
                          <Users />
                          Juntar comanda
                        </Button>
                      )}

                      {groupedOrders.length > 0 && (
                        <Button
                          type="button"
                          className="w-full"
                          size="lg"
                          variant="outline"
                          onClick={() => handleOpenPayment(order)}
                        >
                          <DollarSign />
                          Pagamento
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="flex-1 flex flex-col overflow-hidden">
          <p className="px-4 pt-4 text-xs text-muted-foreground">
            Comandas pagas há mais de 60 dias são removidas automaticamente.
          </p>

          <div className="p-4 flex flex-col sm:flex-row gap-2 w-full sm:max-w-160">
            <Input
              type="text"
              placeholder="Filtrar por nome do cliente..."
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              className="flex-1"
            />

            <Input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} className="sm:w-48" />

            {(historySearchTerm || historyDate) && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setHistorySearchTerm("");
                  setHistoryDate("");
                }}
                className="h-10 w-10"
              >
                <X size={16} />
              </Button>
            )}
          </div>

          {paidOrders.length === 0 ? (
            <p className="p-12 text-sm text-center text-muted-foreground">
              {historySearchTerm || historyDate
                ? "Nenhuma comanda paga encontrada com esse filtro."
                : "Nenhuma comanda paga ainda."}
            </p>
          ) : (
            <div className="flex-1 overflow-auto p-4 no-scrollbar">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {paidOrders.map((order: TOrderResponse) => (
                  <Card className="flex flex-col gap-2 p-4 justify-between" key={order.id}>
                    <span className="font-bold text-lg text-center">{toTitleCase(order.customerName)}</span>

                    <p className="text-xs text-center text-muted-foreground">{formatDateTime(order.createdAt)}</p>

                    {order.operatorName && (
                      <p className="text-xs text-center text-muted-foreground">Atendente: {toTitleCase(order.operatorName)}</p>
                    )}

                    <p className="text-center font-bold">{formatCurrency(order.total)}</p>

                    <Button
                      type="button"
                      className="w-full mt-2"
                      size="lg"
                      variant="outline"
                      onClick={() => setHistoryOrder(order)}
                    >
                      Ver detalhes
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(historyOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryOrder(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col gap-0.5">
            <DialogTitle>Detalhes da comanda</DialogTitle>
            <DialogDescription>Consulta de uma comanda já paga.</DialogDescription>
          </DialogHeader>

          {historyOrder && (
            <div className="space-y-4">
              <div className="flex gap-1">
                <p className="text-sm text-muted-foreground">Cliente: </p>
                <p className="font-bold text-sm">{toTitleCase(historyOrder.customerName)}</p>
              </div>

              <div className="flex gap-1">
                <p className="text-sm text-muted-foreground">Data: </p>
                <p className="text-sm font-medium">{formatDateTime(historyOrder.createdAt)}</p>
              </div>

              {historyOrder.operatorName && (
                <div className="flex gap-1">
                  <p className="text-sm text-muted-foreground">Atendente: </p>
                  <p className="text-sm font-medium">{toTitleCase(historyOrder.operatorName)}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-1.5">
                {historyOrder.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold">{item.quantity}x</span>
                      <span>{toTitleCase(item.product.name)}</span>
                    </div>

                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}

                {historyOrder.isTakeout && (
                  <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>Embalagem para levar</span>
                    <span className="font-medium">{formatCurrency(getChargedTakeoutFee(historyOrder))}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(historyOrder.total)}</span>
              </div>

              {historyOrder.payments.length > 0 && (
                <div className="space-y-2">
                  {historyOrder.payments.map((payment, index) => (
                    <div key={index} className="space-y-1">
                      {historyOrder.payments.length > 1 && (
                        <p className="text-xs font-semibold text-muted-foreground">Pagamento {index + 1}</p>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Forma de pagamento</span>
                        <span className="font-medium text-foreground">
                          {paymentMethodLabels[payment.method]} — {formatCurrency(payment.amount)}
                        </span>
                      </div>

                      {payment.method === "CASH" && payment.amountReceived != null && (
                        <>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Valor recebido</span>
                            <span className="font-medium text-foreground">{formatCurrency(payment.amountReceived)}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Troco</span>
                            <span className="font-medium text-foreground">{formatCurrency(payment.changeDue ?? 0)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handlePrintHistoryOrder(historyOrder)}>
                  <Printer />
                  Imprimir
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PaymentDialog
        open={paymentOrders.length > 0}
        onOpenChange={(open) => !open && handleClosePayment()}
        order={combinedPaymentOrder}
        description={
          paymentOrders.length > 1
            ? "Confirme o recebimento do pagamento conjunto das comandas agrupadas."
            : "Confirme o recebimento do pagamento da comanda."
        }
        disableSplit={paymentOrders.length > 1}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        amountReceived={amountReceived}
        onAmountReceivedChange={setAmountReceived}
        fiadoCustomerName={fiadoCustomerName}
        onFiadoCustomerNameChange={setFiadoCustomerName}
        isSplitOpen={isSplitOpen}
        onSplitOpenChange={setIsSplitOpen}
        onConfirmSplitPayment={handleConfirmSplitPayment}
        onConfirmPayment={handleConfirmPayment}
        isConfirmingPayment={updateOrderStatus.isPending}
      />

      <Dialog open={Boolean(groupingOrder)} onOpenChange={(open) => !open && handleCloseGrouping()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="flex flex-col gap-0.5">
            <DialogTitle>Juntar comanda</DialogTitle>
            <DialogDescription>
              {groupingOrder &&
                `Vincule a comanda de ${toTitleCase(groupingOrder.customerName)} com outra já aberta, pra pagar as duas juntas depois.`}
            </DialogDescription>
          </DialogHeader>

          {groupableTargets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma outra comanda aberta disponível pra vincular.</p>
          ) : (
            <Select value={groupWithSelection} onValueChange={setGroupWithSelection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma comanda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecione uma comanda</SelectItem>
                {groupableTargets.map((target) => (
                  <SelectItem key={target.id} value={String(target.id)}>
                    {toTitleCase(target.customerName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <DialogFooter>
            <Button
              type="button"
              className="w-full"
              disabled={groupWithSelection === "none" || updateOrderStatus.isPending}
              onClick={handleConfirmGrouping}
            >
              {updateOrderStatus.isPending ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </section>
    </>
  );
}
