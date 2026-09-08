/**
 * Auth types for the FastAPI backend.
 *
 * Two separate principals, deliberately kept apart rather than merged behind a
 * single "user": the backend issues staff and client tokens from different
 * endpoints and validates them with different dependencies, so collapsing them
 * here would hide a real authorization boundary.
 */

/** Which login the session came from. Maps to `/identity/auth/{guard}/…`. */
export type GuardType = "staff" | "client";

/** POST /identity/auth/{staff,client}/login and /refresh both return this. */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  /** Access-token lifetime in seconds. */
  expires_in: number;
}

/** A role as the backend serialises it — an object, not a bare string. */
export interface Role {
  id: number;
  name: string;
  guard_name: string;
}

/** GET /identity/auth/client/me */
export interface ClientUser {
  id: number;
  client_id: number;
  name: string;
  email: string;
  is_active: boolean;
  roles: Role[];
}

/** GET /identity/auth/staff/me */
export interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  roles: Role[];
}

export type AuthUser = ClientUser | StaffUser;

/** Narrowing helper — only client users carry a `client_id`. */
export function isClientUser(user: AuthUser): user is ClientUser {
  return (user as ClientUser).client_id !== undefined;
}

/**
 * Normalised session persisted in the browser.
 *
 * `roles` is flattened to names for UI checks. There is no `permissions`:
 * the backend exposes roles only, and inventing an empty permission list here
 * would let UI code write `can("edit-order")` checks that silently always fail.
 * Gate on roles, and treat the API's 403 as the real authority.
 */
export interface Session {
  accessToken: string;
  refreshToken: string;
  guard: GuardType;
  user: AuthUser;
  roles: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}
