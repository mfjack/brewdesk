import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export interface TSetTaskCompleted {
  taskId: number;
  completed: boolean;
}

export const useSetTaskCompleted = createLocalStoreMutation(
  ({ taskId, completed }: TSetTaskCompleted) => localStore.setTaskCompleted(taskId, completed),
  ["setTaskCompleted"],
);
