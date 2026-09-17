"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { supabase } from "@/_lib/supabase/client";

const createEstablishmentFormSchema = z.object({
  name: z.string().trim().min(1, "Campo obrigatório."),
});

type TCreateEstablishmentFormValues = z.infer<typeof createEstablishmentFormSchema>;

export function CreateEstablishmentForm() {
  const router = useRouter();
  const nameId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TCreateEstablishmentFormValues>({
    resolver: zodResolver(createEstablishmentFormSchema),
    defaultValues: { name: "" },
  });

  async function handleCreateEstablishment(data: TCreateEstablishmentFormValues) {
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
      .insert({ name: data.name, owner_user_id: user.id })
      .select()
      .single();

    if (establishmentError) {
      setError(establishmentError.message);
      setIsSubmitting(false);

      return;
    }

    const { error: settingsError } = await supabase
      .from("settings")
      .insert({ establishment_id: establishment.id, name: data.name });

    if (settingsError) {
      setError(settingsError.message);
      setIsSubmitting(false);

      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="flex w-full max-w-sm flex-col gap-3" onSubmit={handleSubmit(handleCreateEstablishment)} noValidate>
      <div className="flex flex-col gap-1">
        <Label htmlFor={nameId} className="sr-only">
          Nome do estabelecimento
        </Label>
        <Input
          id={nameId}
          autoFocus
          autoComplete="organization"
          placeholder="Nome do estabelecimento"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </div>

      {(errors.name || error) && <p className="text-xs text-destructive">{errors.name?.message ?? error}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : "Criar estabelecimento"}
      </Button>
    </form>
  );
}
