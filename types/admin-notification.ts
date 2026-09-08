/** A row shared by all 4 status-notification lists (StatusNotificationList). */
export interface NotificationSettingRow {
  id: number;
  status_name: string;
  /** Note the backend's own capitalised column alias — literally "Active" | "Deactive". */
  Status: "Active" | "Deactive";
}

export interface NotificationListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
}

/** GET .../status-notification-sms-edit/{id} or .../status-notification-ereceipt-edit/{id}. */
export interface NotificationDetail {
  status: string;
  message_body: string | null;
  is_client_active: boolean | number;
  is_customer_active: boolean | number;
}

/** Payload for PUT .../status-notification-{sms,ereceipt}-update/{id} (MessageUpdateDTO). */
export interface UpdateNotificationPayload {
  message_body?: string;
  is_client_active?: boolean;
  is_customer_active?: boolean;
}
