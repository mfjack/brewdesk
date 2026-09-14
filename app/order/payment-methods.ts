import { Banknote, CreditCard, Landmark, QrCode } from "lucide-react";
import type { TPaymentMethod } from "./interface";

export const paymentMethodOptions: { value: TPaymentMethod; label: string; Icon: typeof Banknote }[] = [
  { value: "CREDIT", label: "Crédito", Icon: CreditCard },
  { value: "DEBIT", label: "Débito", Icon: Landmark },
  { value: "PIX", label: "Pix", Icon: QrCode },
  { value: "CASH", label: "Dinheiro", Icon: Banknote },
];

export const paymentMethodLabels: Record<TPaymentMethod, string> = Object.fromEntries(
  paymentMethodOptions.map((option) => [option.value, option.label]),
) as Record<TPaymentMethod, string>;
