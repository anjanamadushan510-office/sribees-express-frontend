import { api, get } from "@/lib/api/client";
import { buildSession, clearSession, getRefreshToken, persistSession } from "@/lib/auth/session";
import type {
  AuthUser,
  ClientUser,
  GuardType,
  LoginCredentials,
  Session,
  StaffUser,
  TokenPair,
} from "@/types/auth";

/**
 * Log in against `/identity/auth/{staff|client}/login`.
 *
 * Two round trips, unlike the Laravel login this replaced: FastAPI's login
 * returns only the token pair, so the profile is fetched separately. Nothing
 * is persisted until both succeed — a stored token we cannot resolve to a user
 * would render the app as "logged in" with an empty profile.
 */
export async function login(
  guard: GuardType,
  credentials: LoginCredentials
): Promise<Session> {
  // Drop any previous session first. The request interceptor attaches whatever
  // token is in storage, so signing in as staff while a stale client token sat
  // there would send the OLD token on the `me` call below and resolve the
  // wrong user.
  clearSession();

  const { data: tokens } = await api.post<TokenPair>(
    `/identity/auth/${guard}/login`,
    credentials
  );

  // Explicit header rather than relying on storage: nothing has been persisted
  // yet, and this call must use the token we just received.
  const user = await get<AuthUser>(`/identity/auth/${guard}/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const session = buildSession(guard, tokens, user);
  persistSession(session);
  return session;
}

/** GET /identity/auth/{guard}/me for an already-established session. */
export async function fetchMe(guard: GuardType): Promise<AuthUser> {
  return guard === "staff"
    ? await get<StaffUser>("/identity/auth/staff/me")
    : await get<ClientUser>("/identity/auth/client/me");
}

/**
 * Log out. Staff have a server-side endpoint that revokes the refresh token;
 * the client guard has none, so there the local clear is all there is.
 */
export async function logout(guard: GuardType): Promise<void> {
  if (guard === "staff") {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await api.post("/identity/auth/staff/logout", { refresh_token: refreshToken });
      }
    } catch {
      // Revocation is best-effort: a network failure must not strand the user
      // on a page they have already decided to leave.
    }
  }
  clearSession();
}
