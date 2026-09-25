"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Card } from "@/_components/ui/card";
import { EmptyState } from "@/_components/ui/empty-state";
import { Header } from "@/_components/ui/header";
import { Separator } from "@/_components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/_components/ui/tabs";

import { useGetSettings } from "../settings/query/useGetSettings";
import { useGetTasks } from "./query/useGetTasks";
import { useSetTaskCompleted } from "./mutation/useSetTaskCompleted";
import { useDeleteTask } from "./mutation/useDeleteTask";
import { TaskFormDialog } from "./_components/task-form-dialog";
import { isTaskDone, isTaskDueToday } from "@/_lib/task-recurrence";
import { useHydratedData } from "@/_lib/use-is-hydrated";
import { toTitleCase } from "@/_lib/to-title-case";
import type { TTask, TTaskPeriod, TTaskRecurrence } from "../order/interface";

const RECURRENCE_LABELS: Record<TTaskRecurrence, string> = {
  once: "Hoje",
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal",
};

const PERIOD_TABS: { value: TTaskPeriod; label: string }[] = [
  { value: "opening", label: "Abertura" },
  { value: "closing", label: "Fechamento" },
];

export default function TasksPage() {
  const { data: settings } = useGetSettings();
  const { data: tasksData } = useGetTasks();
  const tasks = useHydratedData(tasksData);
  const setTaskCompleted = useSetTaskCompleted();
  const deleteTask = useDeleteTask();

  const [activePeriod, setActivePeriod] = useState<TTaskPeriod>("opening");
  // Radix's dialog overlay should already block clicks on the cards behind it, but as a
  // defensive backstop this also explicitly drops the cards' own click handling while any
  // task dialog is open, so a click that somehow lands on a card underneath can't toggle it.
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const findOperatorName = useCallback(
    (operatorId: number) => settings?.operators.find((operator) => operator.id === operatorId)?.name,
    [settings?.operators],
  );

  const handleToggleTask = useCallback(
    (task: TTask) => {
      setTaskCompleted.mutate({ taskId: task.id, completed: !isTaskDone(task) });
    },
    [setTaskCompleted],
  );

  const handleDeleteTask = useCallback(
    (taskId: number) => {
      deleteTask.mutate(taskId, { onSuccess: () => toast.success("Tarefa removida.") });
    },
    [deleteTask],
  );

  function renderTask(task: TTask) {
    const done = isTaskDone(task);
    const recurrenceLabel =
      task.recurrence === "weekly" && task.weekdays.length > 0
        ? `${RECURRENCE_LABELS.weekly}: ${task.weekdays.join(", ")}`
        : RECURRENCE_LABELS[task.recurrence];
    const assignedName = task.assignedOperatorId ? findOperatorName(task.assignedOperatorId) : undefined;

    return (
      <Card
        key={task.id}
        role={isTaskDialogOpen ? undefined : "button"}
        tabIndex={isTaskDialogOpen ? undefined : 0}
        onClick={isTaskDialogOpen ? undefined : () => handleToggleTask(task)}
        onKeyDown={
          isTaskDialogOpen
            ? undefined
            : (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleToggleTask(task);
                }
              }
        }
        className={`flex flex-row items-center gap-3 p-3 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring ${
          isTaskDialogOpen ? "" : "cursor-pointer"
        } ${done ? "bg-green-500/10 ring-green-500/30" : "hover:bg-muted/50"}`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className={`truncate text-sm font-medium ${done ? "text-green-700 line-through dark:text-green-400" : ""}`}>
            {task.title}
          </p>

          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="w-fit">
              {recurrenceLabel}
            </Badge>

            {assignedName && (
              <Badge variant="secondary" className="w-fit">
                {toTitleCase(assignedName)}
              </Badge>
            )}
          </div>
        </div>

        <TaskFormDialog
          operators={settings?.operators}
          task={task}
          onOpenChange={setIsTaskDialogOpen}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={isTaskDialogOpen}
              onClick={(event) => event.stopPropagation()}
            >
              <Pencil />
            </Button>
          }
        />

        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          onClick={(event) => {
            event.stopPropagation();
            handleDeleteTask(task.id);
          }}
          disabled={isTaskDialogOpen || deleteTask.isPending}
        >
          <Trash2 />
        </Button>
      </Card>
    );
  }

  function renderPeriodTab(period: TTaskPeriod) {
    const periodTasks = tasks?.filter((task) => task.period === period) ?? [];
    const dueTodayTasks = periodTasks.filter(isTaskDueToday);
    const notDueTodayTasks = periodTasks.filter((task) => !isTaskDueToday(task));

    if (periodTasks.length === 0) {
      return <EmptyState message="Nenhuma tarefa cadastrada aqui ainda." />;
    }

    // Not-yet-done tasks first, so what's left to do stays at the top — the card's own
    // color already distinguishes done from pending, so there's no separate heading for it.
    const orderedDueTodayTasks = [...dueTodayTasks.filter((task) => !isTaskDone(task)), ...dueTodayTasks.filter(isTaskDone)];

    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-2">{orderedDueTodayTasks.map(renderTask)}</div>

        {notDueTodayTasks.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Não é hoje</p>
            <div className="flex flex-col gap-2">{notDueTodayTasks.map(renderTask)}</div>
          </div>
        )}
      </div>
    );
  }

  const pendingCountForActivePeriod =
    tasks?.filter((task) => task.period === activePeriod && isTaskDueToday(task) && !isTaskDone(task)).length ?? 0;

  return (
    <section className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 flex-wrap gap-2">
        <Header
          title="Tarefas"
          description={pendingCountForActivePeriod > 0 ? `${pendingCountForActivePeriod} pendente(s)` : undefined}
        />

        <TaskFormDialog
          operators={settings?.operators}
          defaultPeriod={activePeriod}
          onOpenChange={setIsTaskDialogOpen}
          trigger={
            <Button size="lg">
              <Plus />
              Nova tarefa
            </Button>
          }
        />
      </div>

      <Separator className="h-px w-full" />

      {tasks === undefined ? (
        <div className="flex-1 p-4">
          <EmptyState message="Carregando tarefas..." />
        </div>
      ) : (
        <Tabs
          value={activePeriod}
          onValueChange={(value) => setActivePeriod(value as TTaskPeriod)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-4 pt-4">
            <TabsList className="rounded-md bg-muted p-2 flex gap-6 justify-start w-fit">
              {PERIOD_TABS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {PERIOD_TABS.map(({ value }) => (
            <TabsContent key={value} value={value} className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {renderPeriodTab(value)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </section>
  );
}
