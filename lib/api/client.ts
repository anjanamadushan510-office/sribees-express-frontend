import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { config } from "@/lib/config";
import { clearSession, getToken } from "@/lib/auth/session";
import type { ApiResponse, Pagination } from "@/types/api";

/**
 * Centralised Axios instance for the Laravel backend.
 * - Attaches the Passport Bearer token on every request.
 * - On 401, clears the session and bounces to the relevant login page.
 */
export const api: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

api.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    const headers = AxiosHeaders.from(req.headers);
    headers.set("Authorization", `Bearer ${token}`);
    req.headers = headers;
  }
  return req;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const guard = getCookie("sx_guard");
      clearSession();
      const loginPath = guard === "staff" ? "/admin/login" : "/login";
      if (!window.location.pathname.includes("login")) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Unwrap the standard ApiResponse envelope, returning just `data`. */
export function unwrap<T>(res: { data: ApiResponse<T> }): T {
  return res.data.data as T;
}

/** Unwrap a paginated ("table") envelope into items + pagination. */
export function unwrapPaginated<T>(res: { data: ApiResponse<T[]> }): {
  items: T[];
  pagination: Pagination;
} {
  return {
    items: (res.data.data as T[]) ?? [],
    pagination:
      res.data.pagination ??
      { total: 0, per_page: 10, current_page: 1, last_page: 1 },
  };
}

/**
 * The backend's `APIHelper::makeAPIResponse` reshapes any non-paginated,
 * top-level `data` object `{ foo: bar }` into `[{ key: "foo", value: bar }]`
 * (see `convertToAPIData` in `app/Helpers/APIHelper.php` — it applies to every
 * `makeReturn()` response that isn't the paginated "table" type). Use this to
 * read a value by key out of an already-`unwrap()`ped payload; it tolerates
 * either the wrapped (array-of-pairs) form or a plain object, so it's safe to
 * reach for whenever an endpoint's `data` nests a single named resource
 * (e.g. `{ order_details: {...} }`, `{ my_profile: {...} }`).
 */
export function pickKey<T>(data: unknown, key: string): T | undefined {
  if (Array.isArray(data)) {
    const found = data.find(
      (d) => d && typeof d === "object" && (d as { key?: string }).key === key
    );
    if (found) return (found as { value: T }).value;
  }
  if (data && typeof data === "object" && key in (data as object)) {
    return (data as Record<string, T>)[key];
  }
  return undefined;
}

/** Pull a human-readable message out of an Axios error for toasts. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: unknown }
      | undefined;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
