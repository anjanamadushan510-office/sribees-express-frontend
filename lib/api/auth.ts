import { api } from "@/lib/api/client";
import { persistSession, sessionFromLogin, clearSession } from "@/lib/auth/session";
import type { GuardType, LoginCredentials, LoginResponse, Session } from "@/types/auth";

/**
 * Authenticate against POST /api/v1/login/{staff|client}.
 * These endpoints return a RAW body ({ user, token, secret, permissions }),
 * not the standard ApiResponse envelope.
 */
export async function login(
  guard: GuardType,
  credentials: LoginCredentials
): Promise<Session> {
  const { data } = await api.post<LoginResponse>(`/v1/login/${guard}`, credentials);
  const session = sessionFromLogin(data);
  persistSession(session, data.secret);
  return session;
}

/** Client-side logout. Clears local session; staff inactivity is handled server-side. */
export function logout(): void {
  clearSession();
}
