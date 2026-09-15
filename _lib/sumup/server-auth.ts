import { createSupabaseServerClient } from "@/_lib/supabase/server";

export async function getAuthenticatedEstablishmentId(): Promise<number | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.from("establishments").select("id").single();

  if (error || !data) {
    return null;
  }

  return data.id;
}
