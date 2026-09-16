import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/_lib/supabase/admin";
import { getAuthenticatedEstablishmentId } from "@/_lib/sumup/server-auth";

export async function GET() {
  const establishmentId = await getAuthenticatedEstablishmentId();

  if (!establishmentId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("sumup_credentials")
    .select("merchant_code, reader_id, reader_name, reader_status")
    .eq("establishment_id", establishmentId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: Boolean(data),
    merchantCode: data?.merchant_code ?? null,
    readerId: data?.reader_id ?? null,
    readerName: data?.reader_name ?? null,
    readerStatus: data?.reader_status ?? null,
  });
}

export async function POST(request: Request) {
  const establishmentId = await getAuthenticatedEstablishmentId();

  if (!establishmentId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const apiKey = String(body.apiKey ?? "").trim();
  const merchantCode = String(body.merchantCode ?? "").trim();

  if (!apiKey || !merchantCode) {
    return NextResponse.json({ error: "Preencha a API Key e o Merchant Code." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("sumup_credentials").upsert(
    {
      establishment_id: establishmentId,
      api_key: apiKey,
      merchant_code: merchantCode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "establishment_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
