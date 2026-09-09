/** A message template the system sends on a status change. */
export interface NotificationSetting {
  id: number;
  key: string;
  channel: string;
  message_template: string;
  is_active: boolean;
  updated_at: string | null;
}

export interface NotificationSettingUpdate {
  message_template?: string;
  is_active?: boolean;
}
