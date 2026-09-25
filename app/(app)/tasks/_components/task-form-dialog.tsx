"use client";

import { useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { ReactNode } from "react";

import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/_components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/_components/ui/dialog";
import { WEEKDAYS, type Weekday } from "@/_lib/delivery-schedule";
import { toTitleCase } from "@/_lib/to-title-case";

import { useCreateTask } from "../mutation/useCreateTask";
import { useUpdateTask } from "../mutation/useUpdateTask";
import type { TOperator, TTask, TTaskPeriod, TTaskRecurrence } from "../../order/interface";

const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Campo obrigatório."),
  recurrence: z.enum(["once", "daily", "weekly", "monthly"]),
  weekdays: z.array(z.string()),
  period: z.enum(["opening", "closing"]),
  assignedOperatorId: z.number().nullable(),
});

type TTaskFormValues = z.infer<typeof taskFormSchema>;

const RECURRENCE_OPTIONS: { value: TTaskRecurrence; label: string }[] = [
  { value: "once", label: "Só hoje" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];

const PERIOD_OPTIONS: { value: TTaskPeriod; label: string }[] = [
  { value: "opening", label: "Abertura" },
  { value: "closing", label: "Fechamento" },
];

interface TTaskFormDialog {
  operators: TOperator[] | undefined;
  trigger: ReactNode;
  task?: TTask;
  // Pre-selects the period when creating a new task from inside a specific tab. Ignored
  // when editing an existing task, which already has its own period.
  defaultPeriod?: TTaskPeriod;
  // Lets the page know whenever this dialog opens/closes, so it can stop the task cards
  // behind it from responding to clicks that land on them anyway.
  onOpenChange?: (open: boolean) => void;
}

function buildDefaultValues(task: TTask | undefined, defaultPeriod: TTaskPeriod): TTaskFormValues {
  return {
    title: task?.title ?? "",
    recurrence: task?.recurrence ?? "once",
    weekdays: task?.weekdays ?? [],
    period: task?.period ?? defaultPeriod,
    assignedOperatorId: task?.assignedOperatorId ?? null,
  };
}

export function TaskFormDialog({ operators, trigger, task, defaultPeriod = "opening", onOpenChange }: TTaskFormDialog) {
  const isEditing = Boolean(task);
  const titleId = useId();

  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TTaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: buildDefaultValues(task, defaultPeriod),
  });

  const recurrence = useWatch({ control, name: "recurrence" });
  const isPending = createTask.isPending || updateTask.isPending;

  function handleSubmitTask(data: TTaskFormValues) {
    if (data.recurrence === "weekly" && data.weekdays.length === 0) {
      setFormError("Selecione ao menos um dia da semana.");

      return;
    }

    setFormError(null);

    const input = {
      title: data.title,
      recurrence: data.recurrence,
      weekdays: data.weekdays as Weekday[],
      period: data.period,
      assignedOperatorId: data.assignedOperatorId,
    };

    const onError = (error: unknown) => setFormError(error instanceof Error ? error.message : "Não foi possível salvar a tarefa.");

    if (task) {
      updateTask.mutate(
        { taskId: task.id, input },
        {
          onSuccess: () => {
            setOpen(false);
            toast.success("Tarefa atualizada com sucesso!");
          },
          onError,
        },
      );
    } else {
      createTask.mutate(input, {
        onSuccess: () => {
          setOpen(false);
          toast.success("Tarefa adicionada com sucesso!");
        },
        onError,
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        onOpenChange?.(nextOpen);

        if (nextOpen) {
          reset(buildDefaultValues(task, defaultPeriod));
          setFormError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados da tarefa." : "Descreva a tarefa e defina como ela se repete."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleSubmitTask)} noValidate>
          <div className="flex flex-col gap-1">
            <Label htmlFor={titleId}>Tarefa</Label>
            <Input id={titleId} autoComplete="off" aria-invalid={Boolean(errors.title)} {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label>Repete</Label>
            <Controller
              control={control}
              name="recurrence"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {recurrence === "weekly" && (
            <div className="flex flex-col gap-1">
              <Label>Dias da semana</Label>
              <Controller
                control={control}
                name="weekdays"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAYS.map((day) => {
                      const isSelected = field.value.includes(day);

                      return (
                        <Button
                          key={day}
                          type="button"
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          aria-pressed={isSelected}
                          onClick={() =>
                            field.onChange(isSelected ? field.value.filter((item) => item !== day) : [...field.value, day])
                          }
                        >
                          {day}
                        </Button>
                      );
                    })}
                  </div>
                )}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <Label>Período</Label>
            <Controller
              control={control}
              name="period"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Atribuir a</Label>
            <Controller
              control={control}
              name="assignedOperatorId"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguém específico</SelectItem>
                    {operators?.map((operator) => (
                      <SelectItem key={operator.id} value={String(operator.id)}>
                        {toTitleCase(operator.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {formError && <p className="text-xs text-destructive">{formError}</p>}

          <DialogFooter className="flex-row gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>

            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
