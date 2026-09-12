"use client";

import { useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Badge } from "@/_components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { toTitleCase } from "@/_lib/to-title-case";
import { OPERATOR_ROLES, OPERATOR_ROLE_LABELS, type TOperatorRole } from "@/_lib/operator-roles";

import { useAddOperator } from "../mutation/useAddOperator";
import { useDeleteOperator } from "../mutation/useDeleteOperator";
import type { TStoreSettings } from "../../order/interface";

export function OperatorsSection({ settings }: { settings: TStoreSettings | undefined }) {
  const addOperator = useAddOperator();
  const deleteOperator = useDeleteOperator();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operatorName, setOperatorName] = useState("");
  const [operatorPin, setOperatorPin] = useState("");
  const [operatorRole, setOperatorRole] = useState<TOperatorRole>("ATENDENTE");
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isFirstOperator = (settings?.operators.length ?? 0) === 0;

  function handleOpenDialog() {
    setOperatorName("");
    setOperatorPin("");
    setOperatorRole("ATENDENTE");
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
      { name: operatorName, pin: operatorPin, role: operatorRole },
      {
        onSuccess: () => setIsDialogOpen(false),
      },
    );
  }

  function handleDeleteOperator(operatorId: number) {
    setDeleteError(null);

    deleteOperator.mutate(operatorId, {
      onError: (error) => setDeleteError(error instanceof Error ? error.message : "Não foi possível excluir o operador."),
    });
  }

  return (
    <div className="max-w-lg space-y-3">
      <div>
        <p className="text-sm font-medium">Operadores</p>
        <p className="text-xs text-muted-foreground">
          Cadastre operadores com PIN pra exigir login antes de usar o sistema. A role define quais páginas o operador
          consegue acessar. Sem operadores cadastrados, o login fica desativado.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {settings?.operators.map((operator) => (
          <Card key={operator.id} className="flex flex-row items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">{toTitleCase(operator.name)}</span>
              <Badge variant="outline">{OPERATOR_ROLE_LABELS[operator.role]}</Badge>
            </div>

            <Button
              variant="destructive"
              size="icon-sm"
              onClick={() => handleDeleteOperator(operator.id)}
              disabled={deleteOperator.isPending}
            >
              <Trash2 />
            </Button>
          </Card>
        ))}

        {settings?.operators.length === 0 && <p className="text-xs text-muted-foreground">Nenhum operador cadastrado.</p>}
      </div>

      {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}

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

            {isFirstOperator ? (
              <p className="text-xs text-muted-foreground">
                O primeiro operador cadastrado vira gerente automaticamente, com acesso a todas as páginas.
              </p>
            ) : (
              <Select value={operatorRole} onValueChange={(value) => setOperatorRole(value as TOperatorRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a role" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATOR_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {OPERATOR_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

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
