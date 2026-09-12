"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { useGetSettings } from "@/app/settings/query/useGetSettings";
import { setActiveOperator, useActiveOperator } from "@/_lib/operator-session";
import { toTitleCase } from "@/_lib/to-title-case";

export function OperatorGate({ children }: { children: React.ReactNode }) {
  const { data: settings, isLoading } = useGetSettings();
  const activeOperator = useActiveOperator();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const operators = settings?.operators ?? [];

  if (isLoading || operators.length === 0 || activeOperator) {
    return <>{children}</>;
  }

  const selectedOperator = operators.find((operator) => operator.id === selectedId);

  function handleConfirmPin() {
    if (!selectedOperator) {
      return;
    }

    if (pin !== selectedOperator.pin) {
      setError("PIN incorreto.");
      setPin("");

      return;
    }

    setActiveOperator({ id: selectedOperator.id, name: selectedOperator.name, role: selectedOperator.role });
    setPin("");
    setError(null);
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
            <Button key={operator.id} variant="outline" size="lg" onClick={() => setSelectedId(operator.id)}>
              {toTitleCase(operator.name)}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="font-medium">{toTitleCase(selectedOperator.name)}</p>

          <Input
            autoFocus
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="PIN"
            className="w-32 text-center"
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleConfirmPin();
              }
            }}
          />

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSelectedId(null);
                setPin("");
                setError(null);
              }}
            >
              Voltar
            </Button>

            <Button type="button" onClick={handleConfirmPin} disabled={pin.length !== 4}>
              Entrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
