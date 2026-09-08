/**
 * The standard JSON envelope returned by the Laravel backend
 * (see APIHelper::makeAPIResponse). Every non-auth endpoint is wrapped in this.
 */
export interface ApiResponse<T = unknown> {
  status_code: number;
  timestamp: string;
  message: string;
  data: T | null;
  error: ApiError | null;
  pagination: Pagination | null;
  metadata: Record<string, unknown> | null;
}

/** Pagination block attached to "table"-type responses. */
export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

/** Error payload. Laravel validation errors come back as a field->messages map. */
export type ApiError = string | Record<string, string[]> | { message?: string } | null;

/** Convenience type for a paginated list result. */
export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

/** Shape used by the backend's dropdown endpoints. */
export interface DropdownOption {
  id: number | string;
  name: string;
  [key: string]: unknown;
}
