/** Backend auth guards exposed to the frontend. */
export type GuardType = "staff" | "client";

/** A permission as returned by the backend ({ authority: "view-orders" }). */
export interface Permission {
  authority: string;
}

/**
 * The authenticated user object. It is a Laravel model serialised to JSON, so
 * it carries many fields. We type the ones the UI relies on and keep the rest open.
 */
export interface AuthUser {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  client_id?: number;
  is_webhook_active?: boolean;
  /** Loaded for client-guard users at login (client.businessLayer). */
  client?: {
    id?: number;
    way_bill_auto_generate?: "Manual" | "Auto" | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Raw payload returned by POST /api/v1/login/{staff|client}.
 * NOTE: the login endpoints do NOT use the standard ApiResponse envelope.
 */
export interface LoginResponse {
  user: AuthUser;
  token: string;
  secret: string;
  permissions?: Permission[];
}

/** Error shape returned by the login endpoints on failure. */
export interface LoginErrorBody {
  error: unknown;
  message: string;
}

/** Decoded contents of the `secret` JWT issued at login. */
export interface DecodedSecret {
  user: AuthUser;
  guard: GuardType;
  role: string[];
  token?: string;
  permissions?: Permission[];
  passwordExpired?: boolean;
  password_reset_key?: string | null;
}

/** Normalised session persisted on the client. */
export interface Session {
  token: string;
  guard: GuardType;
  user: AuthUser;
  roles: string[];
  permissions: string[];
  passwordExpired: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
