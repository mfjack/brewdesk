import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";

export const useDeleteTask = createLocalStoreMutation((taskId: number) => localStore.deleteTask(taskId), ["deleteTask"]);
