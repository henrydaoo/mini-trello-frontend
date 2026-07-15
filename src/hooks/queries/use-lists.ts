import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useListsQuery(boardId: number) {
  return useQuery({
    queryKey: queryKeys.lists.byBoard(boardId),
    queryFn: () => listApi.listForBoard(boardId),
    enabled: Number.isFinite(boardId),
    select: (lists) => [...lists].sort((a, b) => a.position - b.position),
  });
}

export function useCreateList(boardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => listApi.create(boardId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.byBoard(boardId) });
    },
  });
}

export function useRenameList(boardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, name }: { listId: number; name: string }) => listApi.rename(listId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.byBoard(boardId) });
    },
  });
}

export function useDeleteList(boardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: number) => listApi.remove(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.byBoard(boardId) });
    },
  });
}
