"use client";

import { Button } from "@/_components/ui/button";
import { supabase } from "@/_lib/supabase/client";

export function GoogleSignInButton() {
  async function handleClick() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <Button size="lg" onClick={handleClick}>
      Entrar com Google
    </Button>
  );
}
