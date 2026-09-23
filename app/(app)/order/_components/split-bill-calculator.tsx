"use client";

import { useState } from "react";
import { DollarSign, Users } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Separator } from "@/_components/ui/separator";
import { toTitleCase } from "@/_lib/to-title-case";
import { formatCurrency } from "@/_lib/format-currency";
import { buildOrderPayment, getChargedTakeoutFee } from "../order-math";
import type { TOrderPayment, TOrderResponse, TPaymentMethod } from "../interface";
import { PaymentMethodFields } from "./payment-method-fields";
import { paymentMethodOptions } from "../payment-methods";

const SPLIT_BILL_PAYMENT_METHODS = paymentMethodOptions.filter((option) => option.value !== "CONTA");

interface TSplitBillCalculator {
  order: TOrderResponse;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pixQrCodeUrl?: string | null;
  onConfirmSplitPayment: (payments: TOrderPayment[]) => void | Promise<void>;
  isConfirming: boolean;
}

interface TPersonPaymentState {
  method: TPaymentMethod;
  amountReceived: string;
}

const DEFAULT_PERSON_PAYMENT: TPersonPaymentState = { method: "CREDIT", amountReceived: "" };

export function SplitBillCalculator({
  order,
  isOpen,
  onOpenChange,
  pixQrCodeUrl,
  onConfirmSplitPayment,
  isConfirming,
}: TSplitBillCalculator) {
  const [mode, setMode] = useState<"equal" | "items">("equal");
  const [peopleCountInput, setPeopleCountInput] = useState("2");
  const [assignments, setAssignments] = useState<Record<number, number>>({});
  const [personPayments, setPersonPayments] = useState<Record<number, TPersonPaymentState>>({});

  const peopleCount = Math.max(2, parseInt(peopleCountInput, 10) || 2);
  const feeShare = getChargedTakeoutFee(order) / peopleCount;
  const people = Array.from({ length: peopleCount }, (_, index) => index);

  const perPersonTotals = people.map((personIndex) => {
    if (mode === "equal") {
      return order.total / peopleCount;
    }

    const itemsTotal = order.orderItems
      .filter((item) => assignments[item.id] === personIndex)
      .reduce((sum, item) => sum + item.subtotal, 0);

    return itemsTotal + feeShare;
  });

  const unassignedItems = order.orderItems.filter((item) => !(item.id in assignments));

  function getPersonPayment(personIndex: number): TPersonPaymentState {
    return personPayments[personIndex] ?? DEFAULT_PERSON_PAYMENT;
  }

  function isPersonValid(personIndex: number): boolean {
    const state = getPersonPayment(personIndex);

    if (state.method !== "CASH") {
      return true;
    }

    return Number(state.amountReceived) >= perPersonTotals[personIndex];
  }

  const canConfirm = (mode === "equal" || unassignedItems.length === 0) && people.every(isPersonValid);

  function handleOpen() {
    setMode("equal");
    setPeopleCountInput("2");
    setAssignments({});
    setPersonPayments({});
    onOpenChange(true);
  }

  function handleAssign(itemId: number, personIndex: number) {
    setAssignments((prev) => ({ ...prev, [itemId]: personIndex }));
  }

  function handlePersonMethodChange(personIndex: number, method: TPaymentMethod) {
    setPersonPayments((prev) => ({ ...prev, [personIndex]: { ...getPersonPayment(personIndex), method } }));
  }

  function handlePersonAmountReceivedChange(personIndex: number, amountReceived: string) {
    setPersonPayments((prev) => ({ ...prev, [personIndex]: { ...getPersonPayment(personIndex), amountReceived } }));
  }

  function handleConfirmClick() {
    if (!canConfirm) {
      return;
    }

    const payments = people.map((personIndex) => {
      const state = getPersonPayment(personIndex);

      return buildOrderPayment(state.method, perPersonTotals[personIndex], Number(state.amountReceived) || 0);
    });

    void onConfirmSplitPayment(payments);
  }

  if (!isOpen) {
    return (
      <div className="flex justify-start">
        <Button type="button" variant="ghost" size="xs" className="text-muted-foreground" onClick={handleOpen}>
          <Users />
          Dividir conta
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-input p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Dividir conta</p>

        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground whitespace-nowrap">Entre quantas pessoas?</label>
        <Input
          type="number"
          min={2}
          className="w-20"
          value={peopleCountInput}
          onChange={(e) => setPeopleCountInput(e.target.value)}
          onBlur={() => setPeopleCountInput(String(peopleCount))}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "equal" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("equal")}
        >
          Dividir por igual
        </Button>

        <Button
          type="button"
          size="sm"
          variant={mode === "items" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("items")}
        >
          Separar por item
        </Button>
      </div>

      {mode === "items" && (
        <div className="flex flex-col gap-2">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {item.quantity}x {toTitleCase(item.product.name)}
              </span>

              <div className="flex gap-1">
                {people.map((personIndex) => (
                  <Button
                    key={personIndex}
                    type="button"
                    size="icon-lg"
                    variant={assignments[item.id] === personIndex ? "default" : "outline"}
                    onClick={() => handleAssign(item.id, personIndex)}
                  >
                    {personIndex + 1}
                  </Button>
                ))}
              </div>
            </div>
          ))}

          {unassignedItems.length > 0 && (
            <p className="text-xs text-destructive">Atribua todos os itens a uma pessoa pra ver a divisão certa.</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-input pt-3">
        {people.map((personIndex) => (
          <div key={personIndex} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Pessoa {personIndex + 1}</span>
              <span className="font-semibold">{formatCurrency(perPersonTotals[personIndex])}</span>
            </div>

            <PaymentMethodFields
              paymentMethod={getPersonPayment(personIndex).method}
              onPaymentMethodChange={(method) => handlePersonMethodChange(personIndex, method)}
              amountReceived={getPersonPayment(personIndex).amountReceived}
              onAmountReceivedChange={(value) => handlePersonAmountReceivedChange(personIndex, value)}
              total={perPersonTotals[personIndex]}
              pixQrCodeUrl={pixQrCodeUrl}
              methods={SPLIT_BILL_PAYMENT_METHODS}
            />
          </div>
        ))}
      </div>

      <Separator />

      <Button type="button" size="lg" onClick={handleConfirmClick} disabled={!canConfirm || isConfirming}>
        <DollarSign />
        {isConfirming ? "Processando..." : "Confirmar pagamento dividido"}
      </Button>
    </div>
  );
}
