"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { supabase } from "@/_lib/supabase/client";

export function CreateEstablishmentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sessão expirada. Faça login novamente.");
      setIsSubmitting(false);

      return;
    }

    const { data: establishment, error: establishmentError } = await supabase
      .from("establishments")
      .insert({ name: name.trim(), owner_user_id: user.id })
      .select()
      .single();

    if (establishmentError) {
      setError(establishmentError.message);
      setIsSubmitting(false);

      return;
    }

    const { error: settingsError } = await supabase
      .from("settings")
      .insert({ establishment_id: establishment.id, name: name.trim() });

    if (settingsError) {
      setError(settingsError.message);
      setIsSubmitting(false);

      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="flex w-full max-w-sm flex-col gap-3" onSubmit={handleSubmit}>
      <Input
        autoFocus
        placeholder="Nome do estabelecimento"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError(null);
        }}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting || !name.trim()}>
        {isSubmitting ? "Criando..." : "Criar estabelecimento"}
      </Button>
    </form>
  );
}
