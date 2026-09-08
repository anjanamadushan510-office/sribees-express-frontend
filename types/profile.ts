/**
 * Client profile as returned by GET /api/v1/my-profile/client → data.my_profile.
 * It's a full Eloquent model; we type the fields the UI uses and keep the rest open.
 */
export interface ClientProfile {
  id: number;
  name?: string;
  email?: string;
  phone_number?: string;
  phone_no?: string;
  address?: string;
  delivery_email?: string;
  financial_email?: string;
  way_bill_auto_generate?: "Manual" | "Auto" | string;
  ai_status?: "enabled" | "disabled" | string;
  identity_document_front?: string;
  identity_document_back?: string;
  [key: string]: unknown;
}

export interface UpdateAccountPayload {
  delivery_email: string;
  financial_email: string;
  way_bill_auto_generate: "Manual" | "Auto";
  ai_status: "enabled" | "disabled";
}

export interface UpdatePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}
