/**
 * Centralised runtime configuration.
 * Values are read from NEXT_PUBLIC_* env vars so they are available in the browser.
 */
export const config = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:8000/api",
} as const;

/** Storage keys used for persisting the auth session in the browser. */
export const STORAGE_KEYS = {
  token: "sx_token",
  secret: "sx_secret",
  session: "sx_session",
} as const;
