"use client";

import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { useGetSettings } from "@/app/(app)/settings/query/useGetSettings";
import { setActiveOperator, useActiveOperator } from "@/_lib/operator-session";
import { toTitleCase } from "@/_lib/to-title-case";

const pinFormSchema = z.object({
  pin: z.string().length(4, "Digite os 4 dígitos do PIN."),
});

type TPinFormValues = z.infer<typeof pinFormSchema>;

export function OperatorGate({ children }: { children: React.ReactNode }) {
  const { data: settings, isLoading } = useGetSettings();
  const activeOperator = useActiveOperator();
  const pinId = useId();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TPinFormValues>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: { pin: "" },
  });

  const operators = settings?.operators ?? [];

  if (isLoading || operators.length === 0 || activeOperator) {
    return <>{children}</>;
  }

  const selectedOperator = operators.find((operator) => operator.id === selectedId);

  function selectOperator(operatorId: number) {
    setSelectedId(operatorId);
    reset({ pin: "" });
  }

  function handleConfirmPin(data: TPinFormValues) {
    if (!selectedOperator) {
      return;
    }

    if (data.pin !== selectedOperator.pin) {
      setError("pin", { message: "PIN incorreto." });
      reset({ pin: "" });

      return;
    }

    setActiveOperator({ id: selectedOperator.id, name: selectedOperator.name });
    reset({ pin: "" });
    setSelectedId(null);
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <LockKeyhole className="text-muted-foreground" />
        <h1 className="text-lg font-bold">Quem está operando o caixa?</h1>
        <p className="text-sm text-muted-foreground">Selecione seu nome e digite seu PIN pra continuar.</p>
      </div>

      {!selectedOperator ? (
        <div className="flex max-w-md flex-wrap justify-center gap-3">
          {operators.map((operator) => (
            <Button key={operator.id} type="button" variant="outline" size="lg" onClick={() => selectOperator(operator.id)}>
              {toTitleCase(operator.name)}
            </Button>
          ))}
        </div>
      ) : (
        <form className="flex flex-col items-center gap-3" onSubmit={handleSubmit(handleConfirmPin)} noValidate>
          <Label htmlFor={pinId} className="text-base">
            {toTitleCase(selectedOperator.name)}
          </Label>

          <Controller
            control={control}
            name="pin"
            render={({ field }) => (
              <Input
                id={pinId}
                autoFocus
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                placeholder="PIN"
                className="w-32 text-center"
                aria-invalid={Boolean(errors.pin)}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            )}
          />

          {errors.pin && <p className="text-xs text-destructive">{errors.pin.message}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setSelectedId(null)}>
              Voltar
            </Button>

            <Button type="submit">Entrar</Button>
          </div>
        </form>
      )}
    </div>
  );
}
