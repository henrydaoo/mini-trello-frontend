import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { taskApi, type TaskCreatePayload, type TaskUpdatePayload } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { TaskResponse } from "@/lib/types";


export function useTasksForLists(listIds: number[]) {
  const results = useQueries({
    queries: listIds.map((listId) => ({
      queryKey: queryKeys.tasks.byList(listId),
      queryFn: () => taskApi.listForList(listId),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const tasksByListId: Record<number, TaskResponse[]> = {};
  listIds.forEach((listId, i) => {
    tasksByListId[listId] = (results[i].data ?? []).slice().sort((a, b) => a.position - b.position);
  });

  return { tasksByListId, isLoading };
}

export function useCreateTask(listId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TaskCreatePayload) => taskApi.create(listId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byList(listId) });
    },
  });
}

export function useUpdateTask(listId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: TaskUpdatePayload }) =>
      taskApi.update(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byList(listId) });
    },
  });
}

export function useAssignTask(listId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: number; assigneeId: number | null }) =>
      taskApi.assign(taskId, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byList(listId) });
    },
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      targetListId,
      position,
    }: {
      taskId: number;
      sourceListId: number;
      targetListId: number;
      position: number;
    }) => taskApi.move(taskId, targetListId, position),
    onSuccess: (_updatedTask, variables) => {
      // A move affects both the list the task left and the one it joined.
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byList(variables.sourceListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byList(variables.targetListId) });
    },
  });
}

export function useDeleteTask(listId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => taskApi.remove(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byList(listId) });
    },
  });
}
