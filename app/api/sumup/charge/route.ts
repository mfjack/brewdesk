import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/_lib/supabase/admin";
import { getAuthenticatedEstablishmentId } from "@/_lib/sumup/server-auth";
import { createSumupReaderCheckout } from "@/_lib/sumup/client";

export async function POST(request: Request) {
  const establishmentId = await getAuthenticatedEstablishmentId();

  if (!establishmentId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const orderId = Number(body.orderId);
  const cardType = body.cardType === "credit" || body.cardType === "debit" ? body.cardType : undefined;

  if (!orderId) {
    return NextResponse.json({ error: "Comanda inválida." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, total, status, establishment_id")
    .eq("id", orderId)
    .eq("establishment_id", establishmentId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Comanda não encontrada." }, { status: 404 });
  }

  const { data: credentialsRow, error: credentialsError } = await admin
    .from("sumup_credentials")
    .select("api_key, merchant_code, reader_id")
    .eq("establishment_id", establishmentId)
    .maybeSingle();

  if (credentialsError) {
    return NextResponse.json({ error: credentialsError.message }, { status: 500 });
  }

  if (!credentialsRow?.reader_id) {
    return NextResponse.json({ error: "Nenhuma maquininha pareada." }, { status: 400 });
  }

  const returnUrl = `${new URL(request.url).origin}/api/sumup/webhook`;

  try {
    const checkout = await createSumupReaderCheckout(
      {
        apiKey: credentialsRow.api_key,
        merchantCode: credentialsRow.merchant_code,
      },
      credentialsRow.reader_id,
      { amount: Number(order.total), orderId: order.id, returnUrl, cardType },
    );

    const { data: charge, error: insertError } = await admin
      .from("sumup_charges")
      .insert({
        establishment_id: establishmentId,
        order_id: order.id,
        client_transaction_id: checkout.clientTransactionId,
        amount: order.total,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ chargeId: charge.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao cobrar na maquininha." }, { status: 500 });
  }
}
