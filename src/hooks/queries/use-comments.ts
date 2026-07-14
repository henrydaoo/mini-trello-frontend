import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useCommentsQuery(taskId: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.comments.byTask(taskId),
    queryFn: () => commentApi.listForTask(taskId),
    enabled,
  });
}

export function useCreateComment(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => commentApi.create(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.byTask(taskId) });
    },
  });
}

export function useDeleteComment(taskId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => commentApi.remove(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.byTask(taskId) });
    },
  });
}
