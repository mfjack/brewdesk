import type { TTask } from "@/app/(app)/order/interface";
import type { Weekday } from "@/_lib/delivery-schedule";

const JS_DAY_TO_WEEKDAY: Weekday[] = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  return start;
}

function startOfMonth(date: Date): Date {
  const start = startOfDay(date);
  start.setDate(1);

  return start;
}

export function getTodayWeekday(): Weekday {
  return JS_DAY_TO_WEEKDAY[new Date().getDay()];
}

// A "weekly" task is only due on the specific weekdays it's set for — e.g. a task set for
// "Seg, Qua, Sex" simply isn't due on a Tuesday. Every other recurrence is due every day.
export function isTaskDueToday(task: TTask): boolean {
  if (task.recurrence !== "weekly") {
    return true;
  }

  return task.weekdays.includes(getTodayWeekday());
}

// A recurring task has no persisted "done" flag — whether it's done for the current period
// is derived from how long ago it was last checked off, so it comes back on its own at the
// start of the next day/month (or next scheduled weekday) instead of needing something to
// reset it.
export function isTaskDone(task: TTask): boolean {
  if (!task.lastCompletedAt) {
    return false;
  }

  if (task.recurrence === "once") {
    return true;
  }

  const completedAt = new Date(task.lastCompletedAt);
  const now = new Date();

  if (task.recurrence === "monthly") {
    return completedAt >= startOfMonth(now);
  }

  // "daily" and "weekly" (on one of its scheduled days) both just need to have been
  // completed at some point today.
  return completedAt >= startOfDay(now);
}
