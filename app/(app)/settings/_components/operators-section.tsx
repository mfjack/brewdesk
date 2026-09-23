"use client";

import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Badge } from "@/_components/ui/badge";
import { Switch } from "@/_components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_components/ui/dialog";
import { APP_PAGES } from "@/_lib/app-pages";
import { toTitleCase } from "@/_lib/to-title-case";
import { useIsHydrated } from "@/_lib/use-is-hydrated";
import { useIsMasterOperator } from "@/_lib/operator-session";

import { useAddOperator } from "../mutation/useAddOperator";
import { useDeleteOperator } from "../mutation/useDeleteOperator";
import { useUpdateOperator } from "../mutation/useUpdateOperator";
import type { TOperator, TStoreSettings } from "../../order/interface";

const operatorFormSchema = z.object({
  name: z.string().trim().min(1, "Campo obrigatório."),
  pin: z.string().regex(/^\d{4}$/, "O PIN deve ter exatamente 4 dígitos."),
  allowedRoutes: z.array(z.string()),
  isSelfService: z.boolean(),
});

type TOperatorFormValues = z.infer<typeof operatorFormSchema>;

const defaultOperatorFormValues: TOperatorFormValues = { name: "", pin: "", allowedRoutes: [], isSelfService: false };

export function OperatorsSection({ settings }: { settings: TStoreSettings | undefined }) {
  const addOperator = useAddOperator();
  const deleteOperator = useDeleteOperator();
  const updateOperator = useUpdateOperator();
  const isHydrated = useIsHydrated();
  const isMaster = useIsMasterOperator(settings?.operators);
  const nameId = useId();
  const pinId = useId();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [operatorPendingDeletion, setOperatorPendingDeletion] = useState<{ id: number; name: string } | null>(null);
  const [editingOperator, setEditingOperator] = useState<TOperator | null>(null);
  const [editRoutes, setEditRoutes] = useState<string[]>([]);
  const [editIsSelfService, setEditIsSelfService] = useState(false);
  const [editRoutesError, setEditRoutesError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TOperatorFormValues>({
    resolver: zodResolver(operatorFormSchema),
    defaultValues: defaultOperatorFormValues,
  });

  const isFirstOperator = (settings?.operators.length ?? 0) === 0;

  function handleOpenDialog() {
    reset(defaultOperatorFormValues);
    setRoutesError(null);
    setIsDialogOpen(true);
  }

  function handleAddOperator(data: TOperatorFormValues) {
    if (!isFirstOperator && data.allowedRoutes.length === 0) {
      setRoutesError("Selecione ao menos uma página.");

      return;
    }

    setRoutesError(null);

    addOperator.mutate(
      { name: data.name, pin: data.pin, allowedRoutes: data.allowedRoutes, isSelfService: data.isSelfService },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast.success("Operador adicionado com sucesso!");
        },
      },
    );
  }

  function handleConfirmDeleteOperator() {
    if (!operatorPendingDeletion) {
      return;
    }

    setDeleteError(null);

    deleteOperator.mutate(operatorPendingDeletion.id, {
      onSuccess: () => toast.success("Operador excluído com sucesso!"),
      onError: (error) => setDeleteError(error instanceof Error ? error.message : "Não foi possível excluir o operador."),
    });

    setOperatorPendingDeletion(null);
  }

  function handleOpenEditDialog(operator: TOperator) {
    setEditingOperator(operator);
    setEditRoutes(operator.allowedRoutes);
    setEditIsSelfService(operator.isSelfService);
    setEditRoutesError(null);
  }

  function handleSaveOperatorRoutes() {
    if (!editingOperator) {
      return;
    }

    if (editRoutes.length === 0) {
      setEditRoutesError("Selecione ao menos uma página.");

      return;
    }

    setEditRoutesError(null);

    updateOperator.mutate(
      { operatorId: editingOperator.id, allowedRoutes: editRoutes, isSelfService: editIsSelfService },
      {
        onSuccess: () => {
          setEditingOperator(null);
          toast.success("Permissões atualizadas com sucesso!");
        },
        onError: (error) =>
          setEditRoutesError(error instanceof Error ? error.message : "Não foi possível atualizar as permissões."),
      },
    );
  }

  return (
    <div className="max-w-lg space-y-3">
      <div>
        <p className="text-sm font-medium">Operadores</p>
        <p className="text-xs text-muted-foreground">
          Cadastre operadores com PIN pra exigir login antes de usar o sistema, e escolha exatamente quais páginas cada um pode
          acessar. Sem operadores cadastrados, o login fica desativado.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {isHydrated &&
          settings?.operators.map((operator) => (
            <Card key={operator.id} className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{toTitleCase(operator.name)}</span>
                </div>

                {isMaster && (
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" size="icon-sm" onClick={() => handleOpenEditDialog(operator)}>
                      <Pencil />
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => setOperatorPendingDeletion({ id: operator.id, name: operator.name })}
                      disabled={deleteOperator.isPending}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {operator.isSelfService && <Badge variant="secondary">Autoatendimento</Badge>}
                {APP_PAGES.filter((page) => operator.allowedRoutes.includes(page.path)).map((page) => (
                  <Badge key={page.path} variant="outline">
                    {page.label}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}

        {isHydrated && settings?.operators.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhum operador cadastrado.</p>
        )}
      </div>

      {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}

      {isMaster ? (
        <Button type="button" variant="outline" onClick={handleOpenDialog}>
          Adicionar operador
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Apenas o operador master pode gerenciar operadores.</p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo operador</DialogTitle>
          </DialogHeader>

          <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleAddOperator)} noValidate>
            <div className="flex flex-col gap-1">
              <Label htmlFor={nameId}>Nome do operador</Label>
              <Input
                id={nameId}
                autoComplete="off"
                placeholder="Nome do operador"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor={pinId}>PIN</Label>
              <Controller
                control={control}
                name="pin"
                render={({ field }) => (
                  <Input
                    id={pinId}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    placeholder="PIN de 4 dígitos"
                    aria-invalid={Boolean(errors.pin)}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                )}
              />
              {errors.pin && <p className="text-xs text-destructive">{errors.pin.message}</p>}
            </div>

            <Controller
              control={control}
              name="allowedRoutes"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  {APP_PAGES.map((page) => (
                    <div key={page.path} className="flex items-center justify-between gap-2">
                      <span className="text-sm">{page.label}</span>
                      <Switch
                        checked={field.value.includes(page.path)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked ? [...field.value, page.path] : field.value.filter((route) => route !== page.path),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            />

            <Controller
              control={control}
              name="isSelfService"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  <p className="text-sm">Autoatendimento</p>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />

            {isFirstOperator && (
              <p className="text-xs text-muted-foreground">
                Esse é o primeiro operador cadastrado, então o acesso às configurações é garantido automaticamente, além das
                páginas selecionadas acima.
              </p>
            )}

            {routesError && <p className="text-xs text-destructive">{routesError}</p>}

            <DialogFooter>
              <Button type="submit" disabled={addOperator.isPending}>
                {addOperator.isPending ? "Salvando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingOperator)} onOpenChange={(open) => !open && setEditingOperator(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{`Permissões de "${editingOperator ? toTitleCase(editingOperator.name) : ""}"`}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {APP_PAGES.map((page) => (
              <div key={page.path} className="flex items-center justify-between gap-2">
                <span className="text-sm">{page.label}</span>
                <Switch
                  checked={editRoutes.includes(page.path)}
                  onCheckedChange={(checked) =>
                    setEditRoutes((current) =>
                      checked ? [...current, page.path] : current.filter((route) => route !== page.path),
                    )
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <p className="text-sm">Autoatendimento</p>
            <Switch checked={editIsSelfService} onCheckedChange={setEditIsSelfService} />
          </div>

          {editRoutesError && <p className="text-xs text-destructive">{editRoutesError}</p>}

          <DialogFooter>
            <Button type="button" onClick={handleSaveOperatorRoutes} disabled={updateOperator.isPending}>
              {updateOperator.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(operatorPendingDeletion)} onOpenChange={(open) => !open && setOperatorPendingDeletion(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{`Excluir "${operatorPendingDeletion ? toTitleCase(operatorPendingDeletion.name) : ""}"?`}</DialogTitle>
            <DialogDescription>Essa ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-row gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOperatorPendingDeletion(null)}>
              Cancelar
            </Button>

            <Button type="button" variant="destructive" className="flex-1" onClick={handleConfirmDeleteOperator}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
