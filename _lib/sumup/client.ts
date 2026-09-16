const SUMUP_API_BASE = "https://api.sumup.com";

export type TSumupChargeState = "idle" | "charging" | "waiting" | "successful" | "failed";

export interface TSumupCredentials {
  apiKey: string;
  merchantCode: string;
}

export async function pairSumupReader(
  credentials: TSumupCredentials,
  pairingCode: string,
  name: string,
): Promise<{ id: string; name: string; status: string }> {
  const response = await fetch(`${SUMUP_API_BASE}/v0.1/merchants/${credentials.merchantCode}/readers`, {
    method: "POST",
    headers: { Authorization: `Bearer ${credentials.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ pairing_code: pairingCode, name }),
  });

  const data = await response.json();

  if (!response.ok) {
    const reason = data.message || data.error_description || data.error || JSON.stringify(data) || `HTTP ${response.status}`;

    throw new Error(`Não foi possível parear a maquininha (${reason}). Confira o código de pareamento.`);
  }

  return { id: data.id, name: data.name, status: data.status };
}

export async function createSumupReaderCheckout(
  credentials: TSumupCredentials,
  readerId: string,
  input: { amount: number; orderId: number; returnUrl: string; cardType?: "credit" | "debit" },
): Promise<{ checkoutId: string; clientTransactionId: string }> {
  const response = await fetch(`${SUMUP_API_BASE}/v0.1/merchants/${credentials.merchantCode}/readers/${readerId}/checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${credentials.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      total_amount: { currency: "BRL", minor_unit: 2, value: Math.round(input.amount * 100) },
      return_url: input.returnUrl,
      description: `Comanda #${input.orderId} - Tably`,
      affiliate: { foreign_transaction_id: String(input.orderId) },
      ...(input.cardType ? { card_type: input.cardType } : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const reason = data.message || data.error_description || data.error || `HTTP ${response.status}`;

    throw new Error(`Não foi possível iniciar a cobrança na maquininha (${reason}).`);
  }

  return { checkoutId: data.data.checkout_id, clientTransactionId: data.data.client_transaction_id };
}
