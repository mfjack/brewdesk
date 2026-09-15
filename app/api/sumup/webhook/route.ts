import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/_lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const payload = body.payload ?? body;

  const clientTransactionId = payload.client_transaction_id as string | undefined;
  const status = payload.status as string | undefined;
  const failureReason = payload.failure_reason as string | undefined;

  if (!clientTransactionId || !status) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: charge, error: chargeError } = await admin
    .from("sumup_charges")
    .select("id, order_id, amount, status")
    .eq("client_transaction_id", clientTransactionId)
    .maybeSingle();

  if (chargeError) {
    return NextResponse.json({ error: chargeError.message }, { status: 500 });
  }

  if (!charge || charge.status !== "pending") {
    return NextResponse.json({ ok: true });
  }

  const resolvedStatus = status === "successful" ? "successful" : "failed";

  const { error: updateChargeError } = await admin
    .from("sumup_charges")
    .update({ status: resolvedStatus, failure_reason: failureReason ?? null, updated_at: new Date().toISOString() })
    .eq("id", charge.id);

  if (updateChargeError) {
    return NextResponse.json({ error: updateChargeError.message }, { status: 500 });
  }

  if (resolvedStatus === "successful") {
    const { error: orderError } = await admin
      .from("orders")
      .update({
        status: "PAID",
        payments: [{ method: "SUMUP", amount: charge.amount, amountReceived: charge.amount, changeDue: 0 }],
      })
      .eq("id", charge.order_id);

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
