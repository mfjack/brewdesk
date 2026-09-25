import type { TTask, TTaskPeriod, TTaskRecurrence } from "@/app/(app)/order/interface";
import type { Weekday } from "@/_lib/delivery-schedule";
import { supabase } from "@/_lib/supabase/client";
import { getEstablishmentId } from "@/_lib/supabase/establishment";
import { notifyStoreChange } from "@/_lib/store/notify-store-change";

export interface TTaskInput {
  title: string;
  recurrence: TTaskRecurrence;
  weekdays: Weekday[];
  period: TTaskPeriod;
  assignedOperatorId: number | null;
}

interface TTaskRow {
  id: number;
  title: string;
  recurrence: TTaskRecurrence;
  weekdays: Weekday[];
  period: TTaskPeriod;
  assigned_operator_id: number | null;
  last_completed_at: string | null;
  created_at: string;
}

function fromRow(row: TTaskRow): TTask {
  return {
    id: row.id,
    title: row.title,
    recurrence: row.recurrence,
    weekdays: row.weekdays ?? [],
    period: row.period,
    assignedOperatorId: row.assigned_operator_id,
    lastCompletedAt: row.last_completed_at,
    createdAt: row.created_at,
  };
}

function toRow(input: TTaskInput) {
  return {
    title: input.title.trim(),
    recurrence: input.recurrence,
    weekdays: input.recurrence === "weekly" ? input.weekdays : [],
    period: input.period,
    assigned_operator_id: input.assignedOperatorId,
  };
}

export const taskStore = {
  getTasks: async (): Promise<TTask[]> => {
    const { data, error } = await supabase.from("tasks").select("*").order("id");

    if (error) {
      throw new Error(error.message);
    }

    return (data as TTaskRow[]).map(fromRow);
  },

  createTask: async (input: TTaskInput): Promise<TTask> => {
    const establishmentId = await getEstablishmentId();

    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...toRow(input), establishment_id: establishmentId })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["tasks"]);

    return fromRow(data as TTaskRow);
  },

  updateTask: async (taskId: number, input: TTaskInput): Promise<TTask> => {
    const { data, error } = await supabase.from("tasks").update(toRow(input)).eq("id", taskId).select().single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["tasks"]);

    return fromRow(data as TTaskRow);
  },

  setTaskCompleted: async (taskId: number, completed: boolean): Promise<TTask> => {
    const { data, error } = await supabase
      .from("tasks")
      .update({ last_completed_at: completed ? new Date().toISOString() : null })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["tasks"]);

    return fromRow(data as TTaskRow);
  },

  deleteTask: async (taskId: number): Promise<void> => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["tasks"]);
  },
};
