import { supabase } from "@/_lib/supabase/client";

export async function getEstablishmentId(): Promise<number> {
  const { data, error } = await supabase.from("establishments").select("id").single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}
