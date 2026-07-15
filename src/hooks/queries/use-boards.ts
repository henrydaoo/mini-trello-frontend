import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useBoardsQuery() {
  return useQuery({
    queryKey: queryKeys.boards.all,
    queryFn: boardApi.list,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      boardApi.create(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: number) => boardApi.remove(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
    },
  });
}
