import { createLocalStoreMutation } from "@/_lib/create-local-store-mutation";
import { localStore } from "@/_lib/store";
import type { TTaskInput } from "@/_lib/store/tasks";

export const useCreateTask = createLocalStoreMutation((input: TTaskInput) => localStore.createTask(input), ["createTask"]);
