import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listNotificationSettings,
  updateNotificationSetting,
} from "@/lib/api/admin-notifications";
import type { NotificationSettingUpdate } from "@/types/admin-notification";

/**
 * The notification template catalogue.
 *
 * One flat list, not a per-channel one: the backend returns every setting with
 * its `channel` field, so filtering by channel is a client-side concern and
 * splitting it into separate queries would just fetch the same rows twice.
 */
export function useNotificationSettings() {
  return useQuery({
    queryKey: ["admin-notifications"],
    queryFn: listNotificationSettings,
  });
}

export function useUpdateNotificationSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NotificationSettingUpdate }) =>
      updateNotificationSetting(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });
}
