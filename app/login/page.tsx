import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { createSupabaseServerClient } from "@/_lib/supabase/server";
import { GoogleSignInButton } from "./google-sign-in-button";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <LockKeyhole className="text-muted-foreground" />
        <h1 className="text-lg font-bold">Tably</h1>
        <p className="text-sm text-muted-foreground">Entre com sua conta Google pra continuar.</p>
      </div>

      <GoogleSignInButton />
    </div>
  );
}
