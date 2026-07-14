import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useBoardQuery(boardId: number) {
  return useQuery({
    queryKey: queryKeys.boards.detail(boardId),
    queryFn: () => boardApi.get(boardId),
    enabled: Number.isFinite(boardId),
  });
}

export function useInviteMember(boardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => boardApi.addMember(boardId, email),
    onSuccess: (updatedBoard) => {
      queryClient.setQueryData(queryKeys.boards.detail(boardId), updatedBoard);
    },
  });
}

export function useRemoveMember(boardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => boardApi.removeMember(boardId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.detail(boardId) });
    },
  });
}
