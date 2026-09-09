import { api, get } from "@/lib/api/client";
import type {
  NotificationSetting,
  NotificationSettingUpdate,
} from "@/types/admin-notification";

/** GET /notifications/settings — the seeded template catalogue. */
export const listNotificationSettings = () =>
  get<NotificationSetting[]>("/notifications/settings");

/**
 * PATCH /notifications/settings/{id}
 *
 * Partial by design: toggling a template off should not require resending its
 * body, and editing the body should not require restating whether it is on.
 * There is no create or delete — the catalogue is seeded by migration, because
 * a notification key the code never sends is dead weight.
 */
export async function updateNotificationSetting(
  settingId: number,
  payload: NotificationSettingUpdate
): Promise<NotificationSetting> {
  const { data } = await api.patch<NotificationSetting>(
    `/notifications/settings/${settingId}`,
    payload
  );
  return data;
}
