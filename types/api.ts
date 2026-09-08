/**
 * Shapes returned by the FastAPI backend.
 *
 * The most important difference from the Laravel API this app used to talk to:
 * **there is no envelope**. FastAPI returns the resource itself — an object for
 * a single item, a bare array for a list. There is no `{ data, pagination,
 * message }` wrapper and no `convertToAPIData` key/value reshaping, so the old
 * `unwrap()` / `pickKey()` helpers have no counterpart here and are gone.
 */

/** Error body FastAPI returns for a handled failure (HTTPException detail). */
export interface ApiErrorBody {
  detail?: string | ValidationErrorItem[];
}

/** One entry of FastAPI's 422 validation error array. */
export interface ValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * List pagination is `limit`/`offset` query parameters, and the response is a
 * bare array — the backend sends no total count. The UI therefore cannot show
 * "page 3 of 12"; it pages forward while a full page comes back. Anything that
 * needs a true total needs a backend change first.
 */
export interface ListRange {
  limit?: number;
  offset?: number;
}

/** A page of results plus whether another page is likely to exist. */
export interface Page<T> {
  items: T[];
  /** True when the response filled `limit` exactly, so another page may exist. */
  hasMore: boolean;
  limit: number;
  offset: number;
}

/** Shape used by dropdown/select inputs across the admin and customer areas. */
export interface DropdownOption {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

// --- Legacy Laravel envelope -------------------------------------------------
//
// These describe the OLD backend's response shape. They survive only so the
// ~24 admin modules that have not been ported yet still typecheck; nothing new
// should reference them. Every module still importing these is talking to an
// endpoint that does not exist on the FastAPI backend, and the request
// interceptor in lib/api/client.ts rejects those calls before they leave the
// browser. See docs/API-GAPS.md for the porting status.

/** @deprecated Laravel-era envelope. Ported endpoints return the resource itself. */
export interface ApiResponse<T = unknown> {
  status_code: number;
  timestamp: string;
  message: string;
  data: T | null;
  error: unknown;
  pagination: Pagination | null;
  metadata: Record<string, unknown> | null;
}

/** @deprecated Laravel-era page metadata. The FastAPI list endpoints use `Page<T>`. */
export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

/** @deprecated Use `Page<T>`. */
export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}
