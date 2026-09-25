import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TTaskInput } from "@/_lib/store/tasks";

export interface TUpdateTask {
  taskId: number;
  input: TTaskInput;
}

export const useUpdateTask = createLocalStoreMutation(
  ({ taskId, input }: TUpdateTask) => localStore.updateTask(taskId, input),
  ["updateTask"],
);
