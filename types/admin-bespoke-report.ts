/**
 * The ~30 bespoke synchronous endpoints on `ReportsController`
 * (`Modules/Reports`), as opposed to the generic async
 * report-history/queued-reports flow in `types/admin-report.ts`.
 *
 * ~29 of these 36 actions call `makePaginatedResponse()` (standard table
 * envelope, `data` is a raw row array, not reshaped) — those are driven
 * generically here via `BespokeReportDef` + a dynamic-column table, since
 * each report's exact row shape varies and re-declaring ~30 row interfaces
 * wasn't worth it when the columns can be read directly off whatever the API
 * actually returns. The remaining ~7 endpoints (`audit`, the 2 stat-tile
 * dashboards, `getSortingCenterBranch`, the sorting-report CRUD trio) don't
 * fit the generic list pattern and are wired individually — see
 * `lib/api/admin-bespoke-reports.ts` for the non-generic functions.
 */

export type BespokeFilterFieldType =
  | "text"
  | "number"
  | "daterange"
  | "date"
  | "branch"
  | "client"
  | "staff"
  | "primary-status"
  | "sorting-layer"
  | "month-name"
  | "select";

export interface BespokeFilterField {
  key: string;
  label: string;
  type: BespokeFilterFieldType;
  required?: boolean;
  /** Only for type "select". */
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface BespokeReportDef {
  id: string;
  group:
    | "Administrative"
    | "Status Detail"
    | "Clearing & Pending"
    | "Status Count"
    | "Finance"
    | "Sorting";
  title: string;
  description: string;
  /** Any one of these permissions is enough (matches `authorizePermissions([...])`). */
  permissions: string[];
  /** Relative to `/v1/reports/`. */
  path: string;
  filters: BespokeFilterField[];
  /**
   * Filter keys (in order) whose values are appended as URL path segments
   * (e.g. `client-count/list/{yearmonth}`) instead of sent as query params —
   * matches the handful of endpoints shaped like `.../list/{param}` or
   * `.../view/{a}/{b}`.
   */
  pathParams?: string[];
  /** GET unless noted. */
  method?: "get";
}

/** A generic report row — real field names, but the exact shape varies per report. */
export type BespokeReportRow = Record<string, unknown>;
