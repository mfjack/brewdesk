"use client";

import { useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { toTitleCase } from "@/_lib/to-title-case";

import { useAddOperator } from "../mutation/useAddOperator";
import { useDeleteOperator } from "../mutation/useDeleteOperator";
import type { TStoreSettings } from "../../order/interface";

export function OperatorsSection({ settings }: { settings: TStoreSettings | undefined }) {
  const addOperator = useAddOperator();
  const deleteOperator = useDeleteOperator();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operatorName, setOperatorName] = useState("");
  const [operatorPin, setOperatorPin] = useState("");
  const [operatorError, setOperatorError] = useState<string | null>(null);

  function handleOpenDialog() {
    setOperatorName("");
    setOperatorPin("");
    setOperatorError(null);
    setIsDialogOpen(true);
  }

  function handleAddOperator() {
    if (!operatorName.trim()) {
      return;
    }

    if (!/^\d{4}$/.test(operatorPin)) {
      setOperatorError("O PIN deve ter exatamente 4 dígitos.");

      return;
    }

    addOperator.mutate(
      { name: operatorName, pin: operatorPin },
      {
        onSuccess: () => setIsDialogOpen(false),
      },
    );
  }

  return (
    <div className="max-w-lg space-y-3">
      <div>
        <p className="text-sm font-medium">Operadores</p>
        <p className="text-xs text-muted-foreground">
          Cadastre operadores com PIN pra exigir login antes de usar o sistema. Sem operadores cadastrados, o login fica
          desativado.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {settings?.operators.map((operator) => (
          <Card key={operator.id} className="flex flex-row items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">{toTitleCase(operator.name)}</span>
            </div>

            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => deleteOperator.mutate(operator.id)}
              disabled={deleteOperator.isPending}
            >
              <Trash2 />
            </Button>
          </Card>
        ))}

        {settings?.operators.length === 0 && <p className="text-xs text-muted-foreground">Nenhum operador cadastrado.</p>}
      </div>

      <Button type="button" variant="outline" onClick={handleOpenDialog}>
        Adicionar operador
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo operador</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Input
              placeholder="Nome do operador"
              value={operatorName}
              onChange={(e) => {
                setOperatorName(e.target.value);
                setOperatorError(null);
              }}
            />

            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="PIN de 4 dígitos"
              value={operatorPin}
              onChange={(e) => {
                setOperatorPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                setOperatorError(null);
              }}
            />

            {operatorError && <p className="text-xs text-destructive">{operatorError}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleAddOperator} disabled={addOperator.isPending || !operatorName.trim()}>
              {addOperator.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
