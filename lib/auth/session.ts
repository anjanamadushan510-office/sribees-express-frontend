import { STORAGE_KEYS } from "@/lib/config";
import type { DecodedSecret, LoginResponse, Session } from "@/types/auth";

/**
 * Decode a JWT payload WITHOUT verifying the signature.
 * The backend signs the `secret` server-side; the client only reads its claims
 * (guard, roles, permissions) for UI gating. Real authorization is enforced by the API.
 */
export function decodeJwt<T = DecodedSecret>(jwt: string): T | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Build a normalised Session from a raw login response. */
export function sessionFromLogin(res: LoginResponse): Session {
  const decoded = decodeJwt(res.secret);
  const permissionList = (res.permissions ?? decoded?.permissions ?? []).map(
    (p) => p.authority
  );

  return {
    token: res.token,
    guard: decoded?.guard ?? "client",
    user: res.user,
    roles: decoded?.role ?? [],
    permissions: permissionList,
    passwordExpired: decoded?.passwordExpired ?? false,
  };
}

const isBrowser = typeof window !== "undefined";

/** Persist the session to localStorage and mirror the token into a cookie for middleware. */
export function persistSession(session: Session, secret: string): void {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEYS.token, session.token);
  localStorage.setItem(STORAGE_KEYS.secret, secret);
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  // Cookie lets the Next.js middleware gate routes (httpOnly not required: token is a bearer access token).
  document.cookie = `${STORAGE_KEYS.token}=${session.token}; path=/; SameSite=Lax; max-age=86400`;
  document.cookie = `sx_guard=${session.guard}; path=/; SameSite=Lax; max-age=86400`;
}

export function loadSession(): Session | null {
  if (!isBrowser) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.session);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function clearSession(): void {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.secret);
  localStorage.removeItem(STORAGE_KEYS.session);
  document.cookie = `${STORAGE_KEYS.token}=; path=/; max-age=0`;
  document.cookie = `sx_guard=; path=/; max-age=0`;
}
