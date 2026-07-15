import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { NotificationResponse } from "@/lib/types";

export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: notificationApi.list,
    retry: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<NotificationResponse[]>(queryKeys.notifications.all, (prev) =>
        prev ? prev.map((n) => (n.id === updated.id ? updated : n)) : prev
      );
    },
  });
}
