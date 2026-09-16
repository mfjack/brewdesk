import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/_lib/supabase/admin";
import { getAuthenticatedEstablishmentId } from "@/_lib/sumup/server-auth";
import { pairSumupReader } from "@/_lib/sumup/client";

export async function POST(request: Request) {
  const establishmentId = await getAuthenticatedEstablishmentId();

  if (!establishmentId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const pairingCode = String(body.pairingCode ?? "").trim();
  const name = String(body.name ?? "").trim() || "Maquininha";

  if (!pairingCode) {
    return NextResponse.json({ error: "Informe o código de pareamento mostrado na maquininha." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: credentialsRow, error: fetchError } = await admin
    .from("sumup_credentials")
    .select("api_key, merchant_code")
    .eq("establishment_id", establishmentId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!credentialsRow) {
    return NextResponse.json({ error: "Cadastre as credenciais da SumUp antes de parear a maquininha." }, { status: 400 });
  }

  try {
    const reader = await pairSumupReader(
      {
        apiKey: credentialsRow.api_key,
        merchantCode: credentialsRow.merchant_code,
      },
      pairingCode,
      name,
    );

    const { error: updateError } = await admin
      .from("sumup_credentials")
      .update({
        reader_id: reader.id,
        reader_name: reader.name,
        reader_status: reader.status,
        updated_at: new Date().toISOString(),
      })
      .eq("establishment_id", establishmentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ readerId: reader.id, readerName: reader.name, readerStatus: reader.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao parear a maquininha." }, { status: 500 });
  }
}
