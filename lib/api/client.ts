import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { config } from "@/lib/config";
import {
  clearSession,
  getGuard,
  getRefreshToken,
  getToken,
  updateTokens,
} from "@/lib/auth/session";
import type {
  ApiErrorBody,
  ApiResponse,
  ListRange,
  Page,
  Paginated,
  ValidationErrorItem,
} from "@/types/api";
import { FeatureUnavailableError } from "@/lib/api/unavailable";
import type { TokenPair } from "@/types/auth";

/**
 * Axios instance for the FastAPI backend.
 *
 * - Attaches the JWT access token to every request.
 * - On a 401, tries the refresh token ONCE, then replays the original request.
 *   Access tokens are short-lived (30 min staff / 120 min rider by backend
 *   config), so without this every session would dump the user at the login
 *   screen mid-task.
 * - Responses are used as-is: FastAPI returns the resource, not an envelope.
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

/**
 * One shared refresh promise. Without this, a page that fires six requests on
 * mount would run six refreshes the moment the token expires — and because
 * each rotates the refresh token server-side, five of them would fail and log
 * the user out. Every caller awaits the same attempt instead.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  const guard = getGuard();
  if (!refreshToken || !guard) return false;

  try {
    // Deliberately a bare axios call, not `api`: going through the instance
    // would re-enter this interceptor and could recurse on a 401.
    const { data } = await axios.post<TokenPair>(
      `${config.apiBaseUrl}/identity/auth/${guard}/refresh`,
      { refresh_token: refreshToken },
      { headers: { Accept: "application/json" }, timeout: 15_000 }
    );
    updateTokens(data);
    return true;
  } catch {
    return false;
  }
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _sxRetried?: boolean;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._sxRetried) {
      original._sxRetried = true;
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      if (await refreshInFlight) {
        const headers = AxiosHeaders.from(original.headers);
        headers.set("Authorization", `Bearer ${getToken()}`);
        original.headers = headers;
        return api.request(original);
      }
      redirectToLogin();
    } else if (status === 401) {
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const guard = getGuard();
  clearSession();
  const loginPath = guard === "staff" ? "/admin/login" : "/login";
  if (!window.location.pathname.includes("login")) {
    window.location.href = loginPath;
  }
}

/**
 * Wrap a bare array response as a page. The backend returns no total count
 * (see `ListRange` in types/api.ts), so "is there more?" is inferred from the
 * page coming back full — which is why the UI offers next/previous rather than
 * numbered pages.
 */
export function toPage<T>(items: T[], range: Required<ListRange>): Page<T> {
  return {
    items,
    hasMore: items.length === range.limit,
    limit: range.limit,
    offset: range.offset,
  };
}

/** Default page size used across list screens. */
export const DEFAULT_LIMIT = 20;

/** Normalise `limit`/`offset`, applying the default page size. */
export function range(params: ListRange = {}): Required<ListRange> {
  return {
    limit: params.limit ?? DEFAULT_LIMIT,
    offset: params.offset ?? 0,
  };
}

/** Drop undefined/null/empty values so they are not sent as `?x=`. */
export function queryParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

/** Convenience GET returning the body directly. */
export async function get<T>(url: string, cfg?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.get<T>(url, cfg);
  return data;
}

/**
 * Pull a human-readable message out of an error for toasts.
 *
 * FastAPI puts a plain string in `detail` for handled failures, and an array
 * of `{loc, msg}` objects for a 422. Rendering that array raw gives the user
 * "[object Object]", so validation errors are flattened to `field: message`.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as ApiErrorBody | undefined)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item: ValidationErrorItem) => {
          const field = item.loc?.filter((p) => p !== "body").join(".");
          return field ? `${field}: ${item.msg}` : item.msg;
        })
        .join("; ");
    }
    if (error.code === "ECONNABORTED") return "The request timed out";
    if (!error.response) return "Could not reach the API";
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// --- Legacy Laravel call guard -----------------------------------------------

/**
 * `config.apiBaseUrl` already ends in `/api/v1`, so any module still passing a
 * path beginning `/v1/` or `/admin/` is using a Laravel-era URL that has no
 * counterpart on this backend — it would resolve to `/api/v1/v1/...` and 404.
 *
 * Catching it here, in one place, means the ~24 unported admin modules give a
 * precise message instead of a bare "Request failed with status code 404", and
 * it costs no churn across those files while they wait to be ported. Delete
 * this guard once docs/API-GAPS.md is empty.
 */
api.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const url = req.url ?? "";
  if (/^\/(v1|admin)\//.test(url)) {
    throw new FeatureUnavailableError(`${req.method?.toUpperCase() ?? "GET"} ${url}`);
  }
  return req;
});

/** @deprecated Laravel envelope helper — see the note in types/api.ts. */
export function unwrap<T>(res: { data: ApiResponse<T> }): T {
  return res.data.data as T;
}

/** @deprecated Laravel envelope helper — see the note in types/api.ts. */
export function unwrapPaginated<T>(res: { data: ApiResponse<T[]> }): Paginated<T> {
  return {
    items: (res.data.data as T[]) ?? [],
    pagination:
      res.data.pagination ?? { total: 0, per_page: 10, current_page: 1, last_page: 1 },
  };
}

/** @deprecated Laravel `convertToAPIData` helper — see the note in types/api.ts. */
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
