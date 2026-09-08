import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationDetail,
  listNotificationSettings,
  toggleNotificationStatus,
  updateNotification,
  type NotificationChannel,
} from "@/lib/api/admin-notifications";
import type { NotificationListParams, UpdateNotificationPayload } from "@/types/admin-notification";

export function useNotificationSettings(
  channel: NotificationChannel,
  params: NotificationListParams
) {
  return useQuery({
    queryKey: ["admin-notifications", channel, params],
    queryFn: () => listNotificationSettings(channel, params),
    placeholderData: keepPreviousData,
  });
}

export function useToggleNotificationStatus(channel: NotificationChannel) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number | string; isActive: boolean }) =>
      toggleNotificationStatus(channel, id, isActive),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-notifications", channel] }),
  });
}

export function useNotificationDetail(
  channel: "sms" | "ereceipt",
  id: number | string | null
) {
  return useQuery({
    queryKey: ["admin-notification-detail", channel, String(id)],
    queryFn: () => getNotificationDetail(channel, id as number | string),
    enabled: id !== null,
  });
}

export function useUpdateNotification(channel: "sms" | "ereceipt", id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateNotificationPayload) => updateNotification(channel, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications", channel] });
      queryClient.invalidateQueries({
        queryKey: ["admin-notification-detail", channel, String(id)],
      });
    },
  });
}
