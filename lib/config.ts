/**
 * Centralised runtime configuration.
 * Values are read from NEXT_PUBLIC_* env vars so they are available in the browser.
 */
export const config = {
  /**
   * Base URL of the FastAPI backend, INCLUDING `/api/v1`. Every path in
   * `lib/api/*` is written relative to this, so no module repeats the version
   * prefix and bumping to `/api/v2` is a one-line change here.
   *
   * The default is the deployed development API: a fresh clone runs against a
   * real backend instead of a localhost nobody is serving.
   */
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "https://devapiexpress.sribees.com/api/v1",
} as const;

/**
 * Storage keys used for persisting the auth session in the browser.
 *
 * FastAPI issues a short-lived access token plus a long-lived refresh token,
 * so both are stored — the old single-token (Laravel Passport) shape could not
 * survive an expiry without bouncing the user to the login screen.
 */
export const STORAGE_KEYS = {
  token: "sx_token",
  refreshToken: "sx_refresh",
  session: "sx_session",
} as const;

/** Cookie names mirrored for the Next.js `proxy` route guard (see proxy.ts). */
export const COOKIE_KEYS = {
  token: "sx_token",
  guard: "sx_guard",
} as const;
