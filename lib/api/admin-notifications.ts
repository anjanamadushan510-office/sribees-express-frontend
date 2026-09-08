import { api, unwrap, unwrapPaginated } from "@/lib/api/client";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  NotificationDetail,
  NotificationListParams,
  NotificationSettingRow,
  UpdateNotificationPayload,
} from "@/types/admin-notification";

export type NotificationChannel = "sms" | "ereceipt" | "portal" | "pickup";

const LIST_PATHS: Record<NotificationChannel, string> = {
  sms: "/v1/messages/status-notification-sms/list",
  ereceipt: "/v1/messages/status-erecipt-notification/list",
  portal: "/v1/messages/status-portal-notification/list",
  pickup: "/v1/messages/status-pickup-request-sms-notification/list",
};

const TOGGLE_PATHS: Record<NotificationChannel, (id: number | string) => string> = {
  sms: (id) => `/v1/messages/status-notification-sms-action/${id}`,
  ereceipt: (id) => `/v1/messages/status-notification-ereceipt-action/${id}`,
  portal: (id) => `/v1/messages/status-portal-notification-action/${id}`,
  pickup: (id) => `/v1/messages/status-pickup-request-notification-action/${id}`,
};

/** GET list for one of the 4 notification channels. */
export async function listNotificationSettings(
  channel: NotificationChannel,
  params: NotificationListParams
): Promise<Paginated<NotificationSettingRow>> {
  const res = await api.get<ApiResponse<NotificationSettingRow[]>>(LIST_PATHS[channel], {
    params: clean(params),
  });
  return unwrapPaginated<NotificationSettingRow>(res);
}

/** PUT toggle active status for one row of one channel (ToggleStatusDTO). */
export async function toggleNotificationStatus(
  channel: NotificationChannel,
  id: number | string,
  isActive: boolean
): Promise<void> {
  await api.put(TOGGLE_PATHS[channel](id), { is_active: isActive });
}

/**
 * GET .../status-notification-{sms,ereceipt}-edit/{id} — the controller returns
 * `data` as a bare list (`DB::select(...)` result, 0 or 1 rows), so like the
 * Reasons/Zones "get one" endpoints, `convertToAPIData` reshapes it into
 * `[{ key: 0, value: $row }]`; pull `.value`. Only `sms` and `ereceipt` have an
 * edit/detail endpoint — `portal` and `pickup` only support toggling.
 */
export async function getNotificationDetail(
  channel: "sms" | "ereceipt",
  id: number | string
): Promise<NotificationDetail> {
  const path =
    channel === "sms"
      ? `/v1/messages/status-notification-sms-edit/${id}`
      : `/v1/messages/status-notification-ereceipt-edit/${id}`;
  const res = await api.get<ApiResponse<{ key: number; value: NotificationDetail }[]>>(path);
  const rows = unwrap(res) ?? [];
  const detail = rows[0]?.value;
  if (!detail) throw new Error("Notification setting not found");
  return detail;
}

/** PUT .../status-notification-{sms,ereceipt}-update/{id}. */
export async function updateNotification(
  channel: "sms" | "ereceipt",
  id: number | string,
  payload: UpdateNotificationPayload
): Promise<void> {
  const path =
    channel === "sms"
      ? `/v1/messages/status-notification-sms-update/${id}`
      : `/v1/messages/status-notification-ereceipt-update/${id}`;
  await api.put(path, payload);
}

function clean<T extends object>(params: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
