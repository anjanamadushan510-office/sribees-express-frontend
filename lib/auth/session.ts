import { COOKIE_KEYS, STORAGE_KEYS } from "@/lib/config";
import type { AuthUser, GuardType, Session, TokenPair } from "@/types/auth";

const isBrowser = typeof window !== "undefined";

/** Build a normalised Session from a token pair plus the fetched user. */
export function buildSession(
  guard: GuardType,
  tokens: TokenPair,
  user: AuthUser
): Session {
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    guard,
    user,
    // The API sends roles as objects; flatten to names for UI checks.
    roles: (user.roles ?? []).map((role) => role.name),
  };
}

/**
 * Persist the session and mirror the access token into a cookie so the
 * Next.js `proxy` can gate routes server-side (see proxy.ts).
 *
 * The cookie is intentionally readable by script: it is an access token the
 * browser already holds in localStorage, so httpOnly would buy nothing while
 * breaking the client-side redirect logic. The real protection is that the
 * token is short-lived and every endpoint re-validates it.
 */
export function persistSession(session: Session): void {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEYS.token, session.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, session.refreshToken);
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  document.cookie = `${COOKIE_KEYS.token}=${session.accessToken}; path=/; SameSite=Lax; max-age=86400`;
  document.cookie = `${COOKIE_KEYS.guard}=${session.guard}; path=/; SameSite=Lax; max-age=86400`;
}

/** Replace just the tokens after a silent refresh, keeping the user/roles. */
export function updateTokens(tokens: TokenPair): void {
  if (!isBrowser) return;
  const session = loadSession();
  if (!session) return;
  persistSession({
    ...session,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  });
}

/**
 * Parsed-session cache, keyed by the raw string it came from.
 *
 * This is not a performance tweak — it is required for correctness.
 * `loadSession` is a `useSyncExternalStore` snapshot (see providers/
 * auth-provider.tsx), and React compares snapshots with `Object.is`. A fresh
 * `JSON.parse` result is a new object every call, so every render would look
 * like a change and re-render forever: React reports it as "The result of
 * getSnapshot should be cached to avoid an infinite loop", followed by
 * "Maximum update depth exceeded".
 *
 * Returning the same object while the stored string is unchanged makes the
 * snapshot stable, and any real write produces a different string.
 */
let cachedRaw: string | null = null;
let cachedSession: Session | null = null;

export function loadSession(): Session | null {
  if (!isBrowser) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.session);
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  cachedSession = null;
  if (raw) {
    try {
      cachedSession = JSON.parse(raw) as Session;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

export function getToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function getRefreshToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}

export function getGuard(): GuardType | null {
  return loadSession()?.guard ?? null;
}

export function clearSession(): void {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.session);
  document.cookie = `${COOKIE_KEYS.token}=; path=/; max-age=0`;
  document.cookie = `${COOKIE_KEYS.guard}=; path=/; max-age=0`;
}

/**
 * Subscribe to session changes made in OTHER tabs.
 *
 * `storage` events fire only in tabs that did not perform the write, which is
 * exactly what is wanted here: signing out in one tab signs the others out,
 * while the acting tab updates through its own state.
 */
export function subscribeToStorage(onChange: () => void): () => void {
  if (!isBrowser) return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEYS.session) onChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
