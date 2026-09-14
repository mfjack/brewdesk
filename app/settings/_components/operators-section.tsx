"use client";

import { useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";

import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Badge } from "@/_components/ui/badge";
import { Switch } from "@/_components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { APP_PAGES } from "@/_lib/app-pages";
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
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>([]);
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isFirstOperator = (settings?.operators.length ?? 0) === 0;

  function handleOpenDialog() {
    setOperatorName("");
    setOperatorPin("");
    setAllowedRoutes([]);
    setOperatorError(null);
    setIsDialogOpen(true);
  }

  function handleTogglePage(path: string, checked: boolean) {
    setAllowedRoutes((current) => (checked ? [...current, path] : current.filter((route) => route !== path)));
  }

  function handleAddOperator() {
    if (!operatorName.trim()) {
      return;
    }

    if (!/^\d{4}$/.test(operatorPin)) {
      setOperatorError("O PIN deve ter exatamente 4 dígitos.");

      return;
    }

    if (!isFirstOperator && allowedRoutes.length === 0) {
      setOperatorError("Selecione ao menos uma página.");

      return;
    }

    addOperator.mutate(
      { name: operatorName, pin: operatorPin, allowedRoutes },
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
          Cadastre operadores com PIN pra exigir login antes de usar o sistema, e escolha exatamente quais páginas cada um
          pode acessar. Sem operadores cadastrados, o login fica desativado.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {settings?.operators.map((operator) => (
          <Card key={operator.id} className="flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">{toTitleCase(operator.name)}</span>
              </div>

              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => handleDeleteOperator(operator.id)}
                disabled={deleteOperator.isPending}
              >
                <Trash2 />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1">
              {APP_PAGES.filter((page) => operator.allowedRoutes.includes(page.path)).map((page) => (
                <Badge key={page.path} variant="outline">
                  {page.label}
                </Badge>
              ))}
            </div>
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

            <div className="flex flex-col gap-2">
              {APP_PAGES.map((page) => (
                <div key={page.path} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{page.label}</span>
                  <Switch
                    checked={allowedRoutes.includes(page.path)}
                    onCheckedChange={(checked) => handleTogglePage(page.path, checked)}
                  />
                </div>
              ))}
            </div>

            {isFirstOperator && (
              <p className="text-xs text-muted-foreground">
                Esse é o primeiro operador cadastrado, então o acesso às configurações é garantido automaticamente, além das
                páginas selecionadas acima.
              </p>
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
