# SRIBEES Express — Frontend Build Log

## Current state — read this, not the archive below

This is a **Next.js customer + admin portal talking to the FastAPI backend**
(`sribees-express-backend`), which serves `https://devapiexpress.sribees.com/api/v1`.

- **Auth:** JWT access + refresh, rotating refresh tokens, one shared refresh
  promise (`lib/api/client.ts`, `lib/auth/session.ts`). Guards are `staff` and
  `client`.
- **There is no response envelope.** FastAPI returns the resource itself. The
  `unwrap()` / `pickKey()` helpers in `lib/api/client.ts` are deprecated
  leftovers from the previous backend — do not use them in new code.
- **What works and what does not:** [`docs/API-GAPS.md`](docs/API-GAPS.md) is the
  authoritative ledger. Read it before assuming an endpoint exists. Of the ~205
  paths this frontend originally called, one existed on the new backend;
  everything ported since is listed there.
- **The real gate is the e2e scripts**, not typecheck and lint —
  `scripts/e2e-customer-portal.mjs` and `scripts/e2e-admin-portal.mjs` log in
  through the real form against the deployed API and exit non-zero on any failed
  check or console error. Every bug in the 2026-09-09 pass was found by those and
  by nothing else.

## Brand (done — don't redo)

- The name is **"SRIBEES Express"** (exact casing) everywhere in the UI.
- Colours are sampled from the logo (deep raspberry/magenta pink) and already
  applied in `app/globals.css`: `--primary: #c41c5c`, `--brand-from: #d6296b`,
  `--brand-to: #9e1149`, `--accent: #fce4ed` / `--accent-foreground: #8e0f45`
  (dark-mode variants also set). Reuse those tokens (`text-primary`,
  `bg-gradient-to-r from-brand-from to-brand-to`) rather than inventing new ones.

## Architecture

- URL space: customer portal under `(customer)/*`, staff/admin under
  `admin/(portal)/*`. The sidebar is driven by `lib/nav.ts`
  (`customerNavSections` / `adminNavSections`), and
  `components/layout/portal-shell.tsx` is the shared shell — don't duplicate it.
- `lib/api/unavailable.ts` throws `FeatureUnavailableError` for endpoints the
  backend does not implement. **Never** substitute empty data: "you have no
  invoices" is a false statement about someone's account, where an error is a
  true one.
- A request-interceptor guard in `lib/api/client.ts` rejects any path starting
  `/v1/` or `/admin/` before it leaves the browser. Those are legacy URLs from
  the previous backend and could only ever 404.
- Seeding local form state from a fetched resource: use the **guard-then-mount**
  pattern (parent returns early on `isLoading`/`isError`/`!data`, then renders a
  `key={id}`-ed child whose `useState` is lazily initialised from `data`). Not
  `useEffect` + `setState`, which trips the React Compiler's `set-state-in-effect`
  rule.

---

# ▼ ARCHIVE — legacy build log (pre-2026-09-09)

**Everything below this line describes the previous Laravel/MySQL backend and
this frontend as it was written against it.** That backend is not part of this
repository and no longer runs. The response envelope, Passport guards,
`/api/v1/*` route inventory, demo accounts, priority lists and backlog below are
all obsolete; they are kept as the record of how the app got here, and because
the endpoint inventory is the best surviving description of the modules that
still have no counterpart on the current backend.

**Do not follow any instruction below this line.** For current architecture read
the section above; for what the backend can actually serve read
`docs/API-GAPS.md`.

## Live backend now available (added 2026-08-18, later session)

The owner is awake and asked to run this locally end-to-end, so the constraints above have
changed for future sessions — re-read before assuming "no backend" still applies:

- WSL2 (`Ubuntu-22.04`) has its own MySQL 8 + Redis already installed and running, holding the
  **real legacy dev database** (matched `backend/.env` credentials exactly — this was
  the team's actual dev DB, fully migrated except one pending migration, not a throwaway
  seed DB — treat it with the same care as before, still no unprompted migrations).
- Backend is running via `php artisan serve --host=0.0.0.0 --port=8000` **inside WSL**
  (`wsl -d Ubuntu-22.04`), with `REDIS_CLIENT=phpredis` overridden via env var (not written to
  `.env` — the repo's `.env` still says `predis`, which isn't installed via composer; the
  `staff_activity` Redis call in `AuthController::setStaffTimeout` fails otherwise). WSL2
  localhost-forwarding worked for this port (unlike MySQL's own 3306, which only binds
  127.0.0.1 inside the VM and isn't reachable from Windows directly — that's fine, the backend
  process itself talks to MySQL over WSL-internal loopback).
- Frontend must run as a **production build** (`npm run build && npm run start`), not
  `npm run dev` — Turbopack's dev-mode HMR file-watcher goes into a reconnect/rebuild loop
  under Playwright automation (watching `scripts/` picks up any file write) and made login
  flows unreliable. Same finding as the Session-4 QA pass, confirmed again here.
- Two demo accounts exist for testing, clearly labeled so they're easy to find and delete:
  staff `qa-demo@sribeesexpress.local` / `Demo@12345` (Director role, full permissions) and
  client-user `qa-demo-client@sribeesexpress.local` / `Demo@12345` (linked to real client id 1
  "Maneesha Store", Super Admin role). Both required manually setting `latestStatus('active')`
  via Spatie ModelStatus — a bare `save()` isn't enough, `AuthController::login` 403s with
  "deactivated or not activated" otherwise.
- **`php artisan serve` is single-threaded** (PHP's built-in dev server) — pages that fire 2+
  concurrent queries (e.g. `/admin/packages`: dropdown + orders list) genuinely take
  10-20s+ on first load because requests queue serially, not because anything is broken. This
  is a dev-server-only artifact; don't "fix" it, and don't assume a page is buggy just because
  it's slow under `artisan serve` — verify against a real request count before concluding
  there's a frontend bug. Confirmed via direct curl timing (single requests: ~4s; two
  concurrent from the browser: first resolves ~14s in, second ~3s after that).
- **Real bug found, not yet fixed** (backend, out of scope to silently patch — flag it,
  don't touch `Modules/` without being asked): `GET /v1/dashboard/operation-dashboard-status`
  500s with `TypeError: json_decode(): Argument #1 ($json) must be of type string, array
  given` in `backend/Modules/HeadOfficeUserDashboard/app/Action/Dashboard/
  OperationDashboardStatusAction.php:24` — looks like a cache-store mismatch (something now
  returns an already-decoded array where the code still expects a raw JSON string to decode).
  The frontend handles this gracefully already (shows "Couldn't load the dashboard figures
  right now" instead of crashing) — this is purely a backend fix, on the actual team to
  pick up.

## Backend (do not touch)

- Local MySQL (`MySQL80` Windows service) is **stopped** and cannot be started without admin
  rights from this shell. The database name was set by `DB_DATABASE` in `backend/.env`.
- `backend/app/Console/Commands/MigrateCommand.php` wraps `migrate` with a **mandatory
  interactive double-confirm** ("inform Kasun before proceeding") — this is a deliberate
  safety gate on a real team's DB, not a throwaway sandbox. **Do not bypass it** (no calling
  the underlying Laravel migrate command directly, no `--force`/`--no-interaction` tricks,
  no swapping to sqlite and migrating that either — the gate exists for a reason and no one
  is awake to confirm). This means: **no live backend for this session.**
- Consequence for QA: verify against the documented API contracts (this file + reading the
  actual controllers/DTOs/Resources under `backend/Modules/*/app/`) and `npm run build` /
  `npm run lint` / `npm run dev` (page renders, loading/error states look right when fetches
  fail with no backend reachable — that's expected and fine, just make sure it fails
  gracefully, not with a white screen or unhandled exception).
- No browser-screenshot tool is available in this environment. Best-effort visual QA: run
  `npm run dev` and fetch key routes (curl / WebFetch on `http://localhost:3000/...`) to
  confirm they render without a server error.

## Architecture (already established — follow it)

See `AGENTS.md` / `README.md` for the full picture. Key points:

- Backend response envelope (everything except login and `/api/tracking`):
  `{ status_code, timestamp, message, data, error, pagination, metadata }`. Use the
  `unwrap()` helper in `lib/api/client.ts`. Pagination: `{ total, per_page, current_page, last_page }`.
- Auth: Passport bearer tokens, guards `staff` / `client` / `api-client`. Staff login is
  `POST /api/v1/login/staff`, client is `POST /api/v1/login/client`. Session/permissions
  handled by `providers/auth-provider.tsx` + `lib/auth/session.ts` — reuse `useAuth()`
  (`hasPermission`, `hasRole`) for gating nav items and page access, don't reinvent.
- URL space: customer portal under `(customer)/*` (auth:client), staff/admin portal under
  `admin/(portal)/*` (auth:staff). Add new nav items to `lib/nav.ts` (`customerNavSections`
  / `adminNavSections`) as you build each page — that's what drives the sidebar.
  `components/layout/portal-shell.tsx` is the shared shell (header/sidebar) — don't duplicate it.
  `ComingSoon` placeholder component exists — replace it as you wire each page for real.
- Data fetching: TanStack Query hooks colocated in `lib/api/<domain>.ts` (see
  `lib/api/dashboard.ts`, `lib/api/tracking.ts` for the pattern) — one file per backend
  module/domain, typed with `types/api.ts`. Forms: React Hook Form + Zod.
- Tables/lists: paginated list endpoints all share the same envelope shape — build one
  reusable data-table pattern (or reuse whatever's already been built for `shipments`/
  `packages`) rather than bespoke tables per page.

## Full backend endpoint inventory (auth guard → module → routes)

All prefixed `/api` then `/v1` unless noted. Module route files live at
`backend/Modules/<Module>/routes/api.php` — read the source there (and the matching
Controller/DTO/Resource under `app/`) for exact request/response fields before wiring a page;
this list is for scope/prioritization, not a full field spec.

### Public (no auth)
- `POST /api/tracking` `{ waybill_id }` → tracking result — **done** (`/track`)

### `auth:client` (customer portal)
- **ClientDashboard** `/client-dashboard`: status-statistic, finance-statistic, orders-chart,
  orders-sales-chart, orders-success-rate-chart — wire real widgets on `/dashboard`
  (currently ComingSoon-ish per README, some may already be partially wired — check first)
- **Orders** `/client-orders`: list, mini-dashboard, get, archive/{order}, update/{order},
  archive-order/list, create, create-bulk, tracking/{order}, order-remarks/create;
  `/webhook`: status-mapping, order-mapping, list; `/client-barcodes`: list, print-barcode
  → `/shipments`, `/shipments/[id]`, `/shipments/new` (list/detail/new/create-bulk already
  scaffolded — wire for real, add webhook + barcode print if in scope)
- **ClientOperations** `/client-operations`: list, received-returned-orders, received-orders
- **ClientReports** `/client-reports`: processing/delivered/partially-delivered/
  failed-to-deliver/returned-to-client/age orders lists — could live under `/shipments` tabs
  or a new `/reports` customer page
- **ClientFinances** `/client-finances`: receivable-orders, received-orders, my-invoice,
  invoices-view, invoices-view-setoff, print-invoices → new `/finances` or `/invoices` page
- **PriceCard** `/rate-card`: list → `/pricing` (scaffolded, wire for real)
- **PickupRequests** `/client-pickup-request`: list, create, update, cancel, pickup-tracking
  → `/pickups` (scaffolded, wire for real)
- **Clients** `/client-waybill-request`: list, create → waybill request UI (new)
- **Staff/ClientRolePermission** `/client-role`: list/create/update/permissions-categories/get
  → user/role management under `/profile` or new `/team` page
- **User/ClientUserController** `/client-user`: list/get/create/update/status/password-reset
  → sub-user management, likely same `/team` page as above
- **HeadOfficeUserDashboard** `GET /client-alert` → notification bell in header

### `auth:staff` (admin portal)
- **HeadOfficeUserDashboard** `/dashboard`: operation-dashboard-status(+refresh),
  operation-dashboard-kpi; `/client-alert` + `/staff-alert` CRUD → `/admin/dashboard`
  (scaffolded, wire for real) + an alerts/announcements page
- **Orders** `/orders`: archive-order/list, branch-order/list, get-order-branch,
  get-delivery-attempt, get-waybill-details, create, create-bulk, create-auto-waybill,
  create-bulk-auto-waybill, list, search, `{order}` track, order-remarks/create,
  status-update, update-order-destination, update-order-reversal, hold/{order},
  status-identification, pending-warehouse-orders; `/barcodes`: list, print-barcode
  → `/admin/packages` (scaffolded — this is the biggest single page, prioritize it)
- **Clients** `/clients`, `/client-users`, `/client-profiles`, `/client-notify` (full CRUD +
  finance/tax/marketing/API-token/webhook sub-resources) → new `/admin/clients` section
- **Staff** `/staff` (CRUD, attendance clock, order-remark notifications), `/role`
  (roles/permissions), `/waybill-request`, `/waybill-ranges` → new `/admin/staff` +
  `/admin/roles` + `/admin/waybills`
- **Riders** `/riders`: chart, create, update, list, get, status toggle → `/admin/drivers`
  (scaffolded, wire for real)
- **RiderFinances** `/rider-finances`: deposits CRUD/approve/reject/export/print, rider
  orders, dropdown-data → new `/admin/rider-finances`
- **Branches** `/branches` CRUD → `/admin/branches` (scaffolded, wire for real)
- **BranchDashboard** `/branch-dashboard`: statuses-count, orders-count,
  success-rate-monthly, refresh (per-branch) → branch detail view
- **BranchFinances** `/branch-finances`: deposit CRUD, accept-payment, expense
  approve/reject, deposit approve/reject → new `/admin/branch-finances`
- **BranchOperations** `/branch-operations`: list (thin — check controller, may just be a
  dropdown source)
- **Cities** `/cities`, **Zones** `/zones` CRUD → new `/admin/locations` (cities+zones tabs)
- **PickupRequests** `/pickup-request`: list, assign-rider(+view), branch-received,
  cancel/fail, tracking, dashboard → `/admin/pickups` (scaffolded, wire for real)
- **Manifesto** `/manifest`: branch/rider/return-ho/different-destination/
  return-to-client manifest lists → new `/admin/manifests`
- **OrderClearing** `/order-clearing`: today/all order-clear list + update → new
  `/admin/order-clearing`
- **OtherOperations** (sorting): `/other-operations` (city assign, sorting process,
  efficiency, bucket close), `/sorting-buckets`, `/bags` → new `/admin/sorting`
  (this is warehouse-floor tooling, likely lower priority than core CRUD pages)
- **SortingDashboard** `/sorting-dashboard` → small KPI, could fold into `/admin/sorting`
- **AreaManagerDashboard** `/collective-dashboard`: statuses-count, refresh → area-manager
  view (role-gated)
- **MileOperations** `/mile-operations`: list, update → new `/admin/mile-operations`
- **HeadOfficeOperations** `/ho-operations`: orders list, reversal-history, clearance list
  → folds into `/admin/packages` or a HO-specific tab
- **Messages** `/messages`: SMS/e-receipt/portal/pickup notification settings (list/edit/
  update/toggle per channel) → new `/admin/settings/notifications`
- **Reasons** `/reasons` CRUD → new `/admin/settings/reasons` (small, quick win)
- **Reports** `/reports` (~25 report endpoints: audit, client-count, sales, branch-progress,
  status/clearance/pending reports, finance reports, sorting reports) + `/queued-reports`
  + `/report-history` → `/admin/reports` (scaffolded with placeholder — this module alone
  is huge; prioritize report-history + the 2-3 most obviously useful reports first, stub
  the rest as a clean "generate report" list wired to `/queued-reports` + `/report-history`
  which is the generic async-report flow covering most of them)

### Not in scope for this web frontend
- **Mobile** module (`/mobile/*`) — separate rider mobile app's API, not this Next.js portal.
- **Expenses** module — route file is empty on the backend, nothing to wire yet.
- **BranchSupervisorDashboard** — route file is empty on the backend, nothing to wire yet.
- **ClientApi** module — this *is* the external integration API for Sribees' own clients'
  systems to call directly; it's not something this frontend consumes, no page needed
  (maybe a docs/API-keys page under client `/profile` linking to it, already covered by
  `Clients` `/clients/api/{client}` above).

## Priority order (work top to bottom, check off as done)

- [x] Brand rename + color tokens
- [x] `/admin/packages` — full staff order list/detail/create/status-update/waybill (biggest, most central)
- [x] `/shipments` — customer order list/detail/create wired for real (done in a prior session; webhook + barcode print still not done, stretch)
- [x] `/admin/dashboard` + `/dashboard` — wire real KPI widgets (admin dashboard wired this session; customer `/dashboard` was already wired in a prior session)
- [x] `/admin/branches`, `/admin/drivers`, `/admin/pickups` — wire the already-scaffolded pages for real
- [x] `/pickups`, `/pricing`, `/profile` (customer) — already wired in a prior session (verified still correct, and fixed a real bug in `/profile`'s data unwrapping — see session notes)
- [x] `/admin/clients` (new) — client list + detail with settings/finance/tax/marketing/API tabs
- [x] `/admin/staff`, `/admin/roles`, `/admin/waybills` (new)
- [x] `/admin/locations` (cities + zones, new)
- [x] Finance pages: `/admin/rider-finances`, `/admin/branch-finances`, customer `/finances`
- [x] `/admin/manifests`, `/admin/order-clearing`
- [x] `/admin/settings/reasons`, `/admin/settings/notifications`
- [x] `/admin/reports` — report-history + queued-reports async flow (see notes — the ~30
      bespoke synchronous report endpoints in `ReportsController` were deliberately not
      wired, only the 10-type generic async flow)
- [x] `/admin/sorting` (OtherOperations + SortingDashboard) — scoped down, see notes
- [x] Area-manager view (folded into `/admin/dashboard`), `/admin/mile-operations`,
      `/admin/ho-operations`

## Deferred backlog (owner asked to "finish the frontend completely, cover all endpoints" —
## Session 5 worked through this entire list; all 8 items are now done, see Session 5 notes)

- [x] 1. The ~30 bespoke synchronous report endpoints in `Modules/Reports`' `ReportsController`
      — wired via a data-driven registry + generic dynamic-column table (`/admin/reports` →
      "Bespoke Reports" tab), not 30 bespoke pages. See Session 5 notes.
- [x] 2. `/admin/branch-finances` expense-approval sub-workflow + deposit create/edit/accept-
      payment flows.
- [x] 3. `Modules/OtherOperations` hardware-scanner flows (bucket open/close, device settings,
      bags, hold-orders) — `/admin/sorting` now has 5 tabs.
- [x] 4. Invoice detail drill-down + print for customer `/finances` (`invoices-view`,
      `invoices-view-setoff`, `print-invoices`).
- [x] 5. Manual waybill support on `/admin/packages/new`.
- [x] 6. Payment-slip file upload on the rider-finances make-payment dialog.
- [x] 7. Client-user management, client-profile-update-request review, client announcements,
      client-side waybill-request UI (`Modules\Clients`).
- [x] 8. Webhook + barcode printing on customer `/shipments`.

## Session notes (append here each work session — what you did, what's left, any gotchas)

- **Session 1:** Brand rename to "SRIBEES Express" + magenta/pink color tokens
  applied and build-verified green (`npm run build` passed, 19 routes). Confirmed MySQL not
  running + migration safety gate — no live backend this session, see "Backend" above.
  Wrote this log + full endpoint inventory. Handing off to build agent for page-by-page
  implementation starting at the top of the priority list.

- **Session 2 (this one):** Worked top-to-bottom through the priority list. Found on arrival
  that a prior session had already fully wired `/shipments` (+ `[id]`, `/new`), customer
  `/dashboard`, `/pickups`, `/pricing`, and `/profile` — checked those off above after
  re-verifying each against its controller. `npm run build` and `npm run lint` stayed green
  after every step; `npm run dev` + curl (with a fake `sx_token`/`sx_guard` cookie to get
  past the proxy redirect, since there's no way to actually log in without a backend) showed
  clean 200s and no server-side exceptions on every route touched.

  **Important bug found and fixed (affects code from Session 1, not just this session):**
  the backend's `APIHelper::makeAPIResponse` (`backend/app/Helpers/APIHelper.php`,
  `convertToAPIData`) reshapes *any* non-paginated `data` payload from `{ foo: bar }` into
  `[{ key: "foo", value: bar }]` — this applies to every `makeReturn()` response that isn't
  the paginated "table" type (paginated list endpoints are exempt). `lib/api/dashboard.ts`
  had already special-cased this with a local `pick()` helper, but `lib/api/orders.ts`
  (`getClientOrder`, `trackClientOrder`) and `lib/api/profile.ts` (`getMyProfile`) still did
  a naive `unwrap<{foo: T}>(res).foo`, which would have silently returned `undefined` against
  a real backend. Centralised the fix as `pickKey()` in `lib/api/client.ts` and fixed all
  three call sites. **Any new "get single resource" API function should use `pickKey()`,
  not a raw nested-object cast on `unwrap()`'s result** — this is now the established
  pattern, used throughout the new admin API files below.

  **Built this session:**
  - `/admin/packages` (list + `/admin/packages/[id]` detail + `/admin/packages/new` create).
    New files: `types/admin-order.ts`, `lib/api/admin-orders.ts`,
    `lib/hooks/use-admin-orders.ts`, `components/forms/create-admin-order-form.tsx`.
    Detail page has status-update (dialog, primary-status-type dropdown + optional sorting
    layer), remarks (view + add), tracking timeline, reversal history, and a hold-status
    button gated on the `hold-status` permission.
    Assumption: create form only offers backend-assigned (auto) waybills, not manual —
    unlike the customer create form, admin doesn't have a single client's
    `way_bill_auto_generate` flag in context (client is picked from a dropdown per-order),
    and the dropdown endpoint doesn't expose that flag. Manual-waybill admin creation
    (`POST /v1/orders/create` / `create-bulk`) is not wired; revisit if needed.
    Also not wired: bulk create, barcode printing, `search`/`global-search`,
    `update-order-destination`, `update-order-reversal` — all stretch/lower priority.
  - `/admin/dashboard` — wired `operation-dashboard-status` (dynamic per-status count cards,
    however many the backend returns) and `operation-dashboard-kpi` (rendered as a generic
    key/value grid, since that endpoint is a raw Redis-cache passthrough with no fixed
    schema on the backend — see `OperationDashboardKPI.php`) + a manual refresh button.
    New files: `types/admin-dashboard.ts`, `lib/api/admin-dashboard.ts`,
    `lib/hooks/use-admin-dashboard.ts`.
  - `/admin/branches` — list + search + create/edit dialog (multi-select serviced cities,
    new `components/shared/multi-select.tsx`) + activate/deactivate. New files:
    `types/admin-branch.ts`, `lib/api/admin-branches.ts`, `lib/hooks/use-admin-branches.ts`,
    `components/forms/branch-form-dialog.tsx`.
  - `/admin/drivers` (Riders module) — list + search + create/edit dialog (branch select,
    contract type, password + confirm, required on create only) + activate/deactivate.
    New files: `types/admin-rider.ts`, `lib/api/admin-riders.ts`,
    `lib/hooks/use-admin-riders.ts`, `components/forms/rider-form-dialog.tsx`.
  - `/admin/pickups` — list + search + row actions menu (assign rider, mark received at
    branch, mark failed, cancel — each a small dialog). New files: `types/admin-pickup.ts`,
    `lib/api/admin-pickups.ts`, `lib/hooks/use-admin-pickups.ts`. All four status-changing
    actions use the backend's bulk-by-id shape (`request_ids: number[]`) but are only ever
    called with a single id from the row menu — fine for now, revisit if bulk selection is
    wanted later.
  - Added staff-side dropdown fetchers to `lib/api/dropdowns.ts`: `getCities` (public),
    `getBranches`, `getClientsDropdown`, `getOrderStatusDropdown`, `getPrimaryStatusTypes`,
    `getRidersDropdown`, `getSortingLayersDropdown` — all read from `routes/api.php`'s
    `MasterDataController` dropdown group, not a module route file (that inventory line in
    this doc undersells how many dropdowns are actually available staff-side — check
    `backend/routes/api.php` directly, not just `Modules/*/routes/api.php`, when a page
    needs a new one).

  **Gotchas for the next session:**
  - `backend/routes/api.php` (not just `Modules/<Module>/routes/api.php`) holds the shared
    `MasterDataController` dropdown routes (`/v1/dropdown/*`) used across almost every admin
    form — check there first before assuming a dropdown doesn't exist.
  - Permission gating in the UI (`hasPermission(...)`) was matched to each endpoint's
    `authorizePermissions([...])` call where present, but some endpoints (e.g.
    `OrdersController::updateOrderStatus`) don't call `authorizePermissions` at all — the
    status-update button on `/admin/packages/[id]` is therefore shown to any authenticated
    staff user, matching backend behaviour, not gated further.
  - Pre-existing, unrelated ESLint errors (not introduced this session, left alone):
    `components/charts/sparkline.tsx:12` (impure `Math.random` during render),
    `components/layout/portal-shell.tsx:168` and `providers/auth-provider.tsx:36`
    (setState-in-effect). None block `npm run build`; only `npm run lint` reports them.
  - Still no live backend — every new page was verified via `npm run build`,
    `npm run lint`, and `npm run dev` + curl (both with and without a forged
    `sx_token`/`sx_guard` cookie to get past `proxy.ts`) showing clean 200s and no
    server/render exceptions. Field-name accuracy was cross-checked against the actual
    DTOs/Actions/Controllers under `backend/Modules/<Module>/app/`, not guessed — but real
    end-to-end behaviour (validation edge cases, exact 422 shapes per status transition,
    etc.) is still unverified against a running database.

  - `/admin/settings/reasons` (small, quick win as flagged) — list + search + create/edit
    dialog + delete (native `window.confirm`, no `AlertDialog` component exists yet so this
    was the pragmatic choice — consider building a real `AlertDialog` if more destructive
    actions get added). New files: `types/admin-reason.ts`, `lib/api/admin-reasons.ts`,
    `lib/hooks/use-admin-reasons.ts`, `components/forms/reason-form-dialog.tsx`. Added a new
    "Settings" nav section in `lib/nav.ts` for this (only one item in it for now —
    `/admin/settings/notifications` would join it later).
    **Another envelope quirk found here**, distinct from the `pickKey` one above: single-
    resource "get" endpoints that return a *bare* PHP list (`'data' => [$model]`, no named
    key at all — see `ReasonsController::getReason`) still get run through
    `convertToAPIData`, which turns that into `[{ key: 0, value: $model }]` (numeric key,
    not a string one `pickKey` matches by name). Handled inline in `getReason()` in
    `lib/api/admin-reasons.ts` by reading `rows[0]?.value` directly — didn't generalize this
    into a helper since it's a narrower/rarer shape than the named-key case, but worth
    knowing about if another endpoint turns out to return `'data' => [$model]` bare like this.

- **Session 3 (this one, continuing straight down the same priority list):** Built
  `/admin/clients`, `/admin/staff` + `/admin/roles` + `/admin/waybills`, and
  `/admin/locations` — checked off above. `npm run build` and `npm run lint` stayed green
  (baseline 3 pre-existing lint errors unchanged, no new ones) after every group; `npm run
  dev` + curl (with the forged `sx_token`/`sx_guard` cookie trick from Session 2) confirmed
  clean 200s with no server/render exceptions on every new route.

  **Lint fix worth reusing:** the first pass at the client-detail tabs used
  `useEffect(() => { if (!data) return; setX(...) }, [data])` to seed local form state from
  a fetched resource — this trips the React Compiler's `set-state-in-effect` rule (same one
  already violated pre-existing in `portal-shell.tsx` / `auth-provider.tsx`) and briefly
  pushed lint errors from 3 to 9. Fixed by restructuring to a **guard-then-mount** pattern
  instead: the parent component returns early on `isLoading`/`isError`/`!data`, then renders
  a `key={id}`-ed child component that seeds its `useState` from `data` via a lazy
  initializer (`useState(data.field)`, no effect at all). Used this pattern throughout
  Session 3's new forms (`client-*-tab.tsx`, `staff-form-dialog.tsx`, `role-form-dialog.tsx`,
  `city-form-dialog.tsx`, `zone-form-dialog.tsx`) — **prefer it over `useEffect` + `setState`
  for "seed local form state from a fetched single resource" wherever a next session needs
  the same thing.** (The existing `branch-form-dialog.tsx` / `rider-form-dialog.tsx` from
  Session 2 use `form.reset()` in a `useEffect` instead, which the compiler doesn't flag
  since `form.reset` isn't a bare `useState` setter — that pattern is fine too and didn't
  need touching.)

  **Built this session:**
  - `/admin/clients` (list + `/admin/clients/[id]` detail with 5 tabs: Settings, Finance,
    Tax, Marketing, API). New files: `types/admin-client.ts`, `lib/api/admin-clients.ts`,
    `lib/hooks/use-admin-clients.ts`, and `components/admin/client-{settings,finance,tax,
    marketing,api}-tab.tsx` (new `components/admin/` domain folder, alongside the existing
    `components/customer/` one). Notable scope calls:
    - The backend has two confusingly-overlapping "information" endpoints
      (`clients/information/{client}` = training metadata only: `trained_by_id`/
      `trained_at`; `clients/client-information/{client}` = waybill/branch settings +
      business type + ID photos). Consolidated both, plus `client-registered-details`
      (registration no/date), into one "Settings" tab with three independently-saved cards
      rather than mirroring the backend's confusing tab names 1:1.
      `getClientInformation`'s full payload (business_type array, ID document URLs) is
      fetched but only the 4 `UpdateInformationDTO` fields are actually editable — the ID
      photo upload flow (multipart) was **not** wired, out of scope for tonight.
      `way_bill_auto_generate`/`nearest_city`/`pickup_branch`/`is_multiple_business_active`
      editing is wired for real.
    - `pickup_branch` in `UpdateInformationDTO` validates against `exists:branches,name`
      (a **string name**, not an id) — the branch picker submits the branch's name text
      directly, not its id. Worth remembering if another form ever touches this field.
    - There's no "get one client" endpoint with the summary fields (name, email, bank
      details, status) shown on the Overview card — reused `clients/list` with a `client_id`
      filter (`useAdminClientRow`) since `ClientsListDTO` accepts it. No "create client"
      staff-side endpoint exists either (client creation is `client/register`, a public
      self-registration route, out of scope for this admin portal) — so there's no "New
      Client" button, matching the backend's actual capability.
    - Reused the same bare-list `.value` envelope quirk (see Reasons note above) — N/A here,
      all Clients "get" endpoints use named keys (`info`, `client`, `rate_card`, `tax_info`,
      `marketingInfo`), so plain `pickKey` sufficed throughout `lib/api/admin-clients.ts`.
  - `/admin/staff`, `/admin/roles`, `/admin/waybills`. New files: `types/admin-staff.ts`,
    `lib/api/admin-staff.ts`, `lib/hooks/use-admin-staff.ts`,
    `components/forms/staff-form-dialog.tsx` (create/edit, mirrors the Session 2 rider-form
    pattern: role + branches (multi) + clients (multi, optional) + password/confirm);
    `types/admin-role.ts`, `lib/api/admin-roles.ts`, `lib/hooks/use-admin-roles.ts`,
    `components/forms/role-form-dialog.tsx` (permission picker as toggle-chip groups by
    category — no `Checkbox` UI primitive exists yet, this was the pragmatic choice over
    adding one; role **name** can only be set on create, `UpdateRoleDTO` only accepts
    `permission_ids`, matching the backend); `types/admin-waybill.ts`,
    `lib/api/admin-waybills.ts`, `lib/hooks/use-admin-waybills.ts`,
    `components/forms/waybill-request-dialog.tsx` (create only, with a "suggest next
    available start" button wired to `waybill-ranges/next`; inline edit of an existing
    request, and the separate rider-side `/staff/waybill-request` client route, were **not**
    wired — reject/restore/activate/deactivate cover the main admin workflow). Added a new
    "Team" nav section for all three.
    **Two more envelope-shape findings, added to the running list:**
    - `RolePermissionController::getRole` returns `'data' => $data` where `$data` is a
      *bare associative array* (`{id, name, permissions}`, no wrapping key at all) — still
      gets the `convertToAPIData` treatment, reshaped into `[{key:'id',...}, {key:'name',
      ...}, {key:'permissions',...}]`. Handled with three separate `pickKey()` calls in
      `getRole()` in `lib/api/admin-roles.ts`.
    - `RolePermissionController::getPermissionsCategories` uses `response()->json([...])`
      **directly**, bypassing `APIHelper::makeAPIResponse` (and `convertToAPIData`)
      entirely — so unlike almost every other endpoint in this codebase, its `data` is the
      raw array as-is, no reshaping. Easy to miss since it *looks* like every other
      `makeReturn()` call from the route list alone; only reading the controller body
      revealed it uses a different response helper. **Lesson: always check whether a
      controller method calls `makeReturn`/`makePaginatedResponse` vs. building its own
      response** — this is the second confirmed example (after the public `/api/tracking`
      `OrderAPIResource`) of an endpoint that skips the envelope reshape.
  - `/admin/locations` (Cities + Zones tabs on one page, mirroring the Branches
    create/edit-dialog + multi-select pattern from Session 2). New files:
    `types/admin-location.ts`, `lib/api/admin-locations.ts`,
    `lib/hooks/use-admin-locations.ts`, `components/forms/city-form-dialog.tsx`,
    `components/forms/zone-form-dialog.tsx`. `ZonesController::getZones` has the same
    bare-numeric-list shape as `ReasonsController::getReason` (`'data' => [$zone]` →
    `[{key:0,value:$zone}]`) — handled the same way (`rows[0]?.value`) in `getZone()`.
  - Added more staff dropdown fetchers to `lib/api/dropdowns.ts` as needed:
    `getStaffDropdown`, `getTaxTypesDropdown`, `getRolesDropdown`, `getPermissionsDropdown`,
    `getDistrictDropdown`, `getZonesDropdown` — all still from `backend/routes/api.php`'s
    shared `MasterDataController` group, same as Session 2's batch.

  Continuing straight on (no new session number — same work session): built all three
  remaining finance pages.
  - `/admin/rider-finances` (list + `/admin/rider-finances/[id]` detail with make-payment/
    approve/reject dialogs). New files: `types/admin-rider-finance.ts`,
    `lib/api/admin-rider-finances.ts`, `lib/hooks/use-admin-rider-finances.ts`.
    **Two more findings for the running envelope-shape list:**
    - This whole module doesn't use `makePaginatedResponse` — the list action builds its
      own `data: { deposits, pagination, filters, summary }` and returns it through the
      plain `makeReturn()`, so it still gets the `convertToAPIData` treatment (needs
      `pickKey`, unlike every other paginated list in this codebase which is exempt). Its
      `pagination` block also uses different field names (`total_pages` instead of
      `last_page`) than the standard envelope — remapped in `listRiderDeposits()` so the
      shared `<Pagination>` component keeps working unmodified.
    - `getDropdownData` is registered as a route (`GET /rider-finances/dropdown-data`) but
      **the controller method doesn't exist** — calling it would 500. Did not wire it;
      reused the existing generic `dropdown/riders` endpoint for the rider filter instead.
    - Payment-slip file upload (`MakePaymentRequest`'s nullable `payment_slip`) was **not**
      wired — the make-payment dialog submits text fields only, matching the "nullable"
      part of that field's validation.
  - `/admin/branch-finances` (list + `/admin/branch-finances/[id]` detail with approve/
    reject). New files: `types/admin-branch-finance.ts`, `lib/api/admin-branch-finances.ts`,
    `lib/hooks/use-admin-branch-finances.ts`. **Deliberately scoped down**: this backend
    module also has deposit create/edit, an "accept payment" flow, and a whole separate
    expense-approval sub-workflow (`approve-branch-expense/list`, `approve-expense/{id}`,
    `reject-expense/{id}`, with their own list/view actions) — none of that is wired, only
    list + view + approve + reject deposit, mirroring the rider-finances pattern. Revisit if
    the expense-approval workflow turns out to be a priority.
  - Customer `/finances` (tabs: My Invoices, Receivable Orders, Received Orders). New
    files: `types/finance.ts`, `lib/api/finances.ts`, `lib/hooks/use-finances.ts`. Added
    `/finances` to both `CUSTOMER_PREFIXES` **and** the `matcher` config array in
    `proxy.ts` — the matcher array gates which paths even run the proxy function, so a new
    protected customer route needs an entry in both places, not just `CUSTOMER_PREFIXES`
    (easy to miss, worth flagging for the next new customer route too). Invoice detail
    drill-down (`invoices-view`, `invoices-view-setoff`) and print-invoice were **not**
    wired — the three list tabs cover the main "what do I owe / what's been paid" use case;
    revisit if per-invoice line-item drill-down is wanted.

  **`proxy.ts` guard re-verified (per coordinator follow-up):** `/finances` was already
  added to both `CUSTOMER_PREFIXES` and `matcher` in the same turn it was built (see above)
  — the "flag for next time" phrasing in the handoff was about the *general lesson*
  (matcher + prefixes both need an entry), not an unfixed gap. Re-confirmed nothing
  regressed: `npm run build` / `npm run lint` still at clean baseline, and cross-checked
  every `page.tsx` under `app/(customer)/` (`dashboard`, `finances`, `pickups`, `pricing`,
  `profile`, `shipments` + `shipments/new` + `shipments/[id]`) against both arrays in
  `proxy.ts` — all covered. Live-curled all 8 with no cookie: every one 307-redirects to
  `/login`, confirming the guard is actually enforced, not just configured.

  Continuing on (still same session): built the next three items.
  - `/admin/manifests` (5 read-only tabs: Branch, Rider, Return to HO, Different
    Destination, Return to Client — all `makePaginatedResponse`, no envelope quirk to work
    around). New files: `types/admin-manifest.ts`, `lib/api/admin-manifests.ts`,
    `lib/hooks/use-admin-manifests.ts`.
  - `/admin/order-clearing` (Today / All tabs, each with a "scan or type a waybill to mark
    it cleared" quick-action input wired to the respective update endpoint — this is a
    warehouse-floor scanning workflow, not a per-row button, matching what the single
    `{waybill_id}` PUT payload implies). New files: `types/admin-order-clearing.ts`,
    `lib/api/admin-order-clearing.ts`, `lib/hooks/use-admin-order-clearing.ts`. Note: the
    "today" list's `cleared_status` is a formatted string (`"Cleared"`/`"Not Cleared"`) but
    the "all" list's `cleared_status` is the raw `0`/`1` boolean column — different shapes
    for the same-sounding field across the two sibling endpoints in this module, typed
    separately in `types/admin-order-clearing.ts` rather than forcing one shared type.
  - `/admin/settings/notifications` (4 tabs: SMS, E-receipt, Portal, Pickup Requests — list
    + toggle active/inactive for all four, plus an edit dialog for SMS/E-receipt only since
    those are the only two channels with a message body to edit; Portal/Pickup only expose
    a toggle route on the backend, no edit route, so no edit button renders for those tabs).
    New files: `types/admin-notification.ts`, `lib/api/admin-notifications.ts`,
    `lib/hooks/use-admin-notifications.ts`, `components/forms/notification-edit-dialog.tsx`.
    **A fourth confirmed variant of the envelope-reshaping quirk**: `editSmsNotification`/
    `editEreceiptNotification` return `'data' => $detail` where `$detail` is a bare
    `DB::select()` array (0 or 1 rows) — same "numeric-key bare list" shape as
    `ReasonsController::getReason` and `ZonesController::getZones`, handled the same way
    (`rows[0]?.value`) in `getNotificationDetail()`. **This is now the fourth distinct
    envelope shape found across the build** (named-key via `pickKey`, bare-numeric-list via
    `rows[0]?.value`, a controller that bypasses the envelope helper entirely, and a custom
    non-`makePaginatedResponse` paginated shape needing its own remap) — treating every new
    "get single resource" endpoint as an unknown until its controller body is actually read,
    not assumed from the route list, remains the right default for whatever's wired next.

  Continuing on (still same session): built `/admin/reports`.

  - **Scope decision, matching this file's own earlier guidance**: `Modules/Reports`
    exposes ~30 bespoke synchronous report endpoints on `ReportsController` (audit,
    client-count, sales, branch-progress, status/clearance/pending reports, finance
    reports, sorting reports, etc.) *plus* a generic async job flow
    (`QueuedReportsController` + `ReportHistoryController`) covering 10 report types
    (`ReportType` enum: branch manifest, diff-dest manifest, branch progress, return-client
    manifest, return-HO manifest, rider manifest, all-orders export, branch deposits,
    branch orders, all invoices). Wired **only the generic async flow** — a dashboard
    (pending/processing/completed/failed counts), a "Generate report" panel (type picker +
    optional branch + date range, date range required only for the two manifest types per
    `QueuedReportFilterDTO`'s conditional validation), and a history table (search/filter by
    type+status, view detail as a generic dynamic-column table since `result_data` shape
    varies per report type, re-run, and Excel download). The 30 bespoke endpoints are
    **not** wired — each would need its own bespoke DTO/fields inspection and this file
    already flagged that tradeoff as correct given the size of the module.
  - **A fifth, most drastic envelope shape**: this whole module (`ReportHistoryController`,
    `QueuedReportsController`) uses `response()->json([...])` directly with a completely
    different top-level shape — `{ success, data, message?, pagination? }` — not
    `{ status_code, timestamp, message, data, error, pagination, metadata }` at all. Neither
    `unwrap()` nor `pickKey()` apply; built a dedicated `ReportApiEnvelope<T>` type and
    read `res.data.data/.pagination` directly in `lib/api/admin-reports.ts` (documented at
    the top of `types/admin-report.ts`). Its `pagination` block *does* happen to match the
    standard `{current_page,last_page,per_page,total}` shape (unlike RiderFinances' custom
    one from an earlier session), so no remapping was needed there — but don't assume that
    holds for the next non-standard controller either; check field names each time.
  - Excel download (`report-history/{id}/download-excel`) returns a real binary file, not
    JSON — a plain `<a href>`/`window.open` can't carry the bearer token, so
    `downloadReportExcel()` fetches it via axios with `responseType: "blob"` and triggers a
    client-side save through a temporary anchor element. This is the first file-download
    flow built this session; the same pattern should be reused for the next one rather than
    reinvented (e.g. `barcodes/print-barcode`, invoice PDFs, if those get wired later).
  - New files: `types/admin-report.ts`, `lib/api/admin-reports.ts`,
    `lib/hooks/use-admin-reports.ts`. No new nav item was added for the type filters (they
    reuse the existing "Reports" nav entry, already present from a prior session's
    scaffolding).

  Continuing on (still same session): built the final four items on the priority list,
  completing it end to end.

  - `/admin/sorting` (OtherOperations + SortingDashboard). **Deliberately scoped way down**:
    this backend module is genuinely warehouse-scanner hardware tooling (opening/closing
    physical sorting buckets, per-device settings, bag creation, hold-order-at-bucket flows)
    that doesn't map well to a generic admin web form — matches this file's own "lowest
    priority, warehouse-floor tooling" framing from the original inventory. Wired only the
    two parts that are genuinely normal admin actions: a read-only sorting-center throughput
    table (`GET /sorting-dashboard`) and a "city confirmation" list + assign-city dialog
    (`other-operations/orders/list` + `update-order-city`, for orders whose city was only
    address-suggested and needs HO confirmation). Bucket open/close, device settings, bags,
    and hold-orders are **not** wired — flagging clearly in case a future session has reason
    to prioritize the hardware-scanner flows after all.
    **A sixth envelope shape**: `SortingDashboardController::getSortingCount` hand-builds
    `response()->json(['status_code' => 200, 'data' => ...])` — no `success`, `message`,
    `pagination`, or `error` keys at all, and (like the Reports module) no
    `convertToAPIData` reshape since it bypasses `APIHelper` entirely. Read directly via a
    tiny local response type in `lib/api/admin-sorting.ts` rather than `unwrap()`/`pickKey()`.
    New files: `types/admin-sorting.ts`, `lib/api/admin-sorting.ts`,
    `lib/hooks/use-admin-sorting.ts`.
  - `/admin/mile-operations` (MileOperations module — the last-mile pickup/return status
    queue: "received at pickup branch" → "assigned to pickup rider" → … → the return-order
    mirror of the same flow, 10 `PrimaryStatusType` keys total). The list endpoint requires
    at least one status in its filter (not optional, unlike every other list module built
    this session), so the UI is built around a required "status queue" selector + a
    pickup/return flow toggle, with a per-row "Update status" dialog offering all 10 target
    statuses and a conditional rider picker for the two "assign to rider" statuses — mirrors
    the `/admin/packages/[id]` status-update dialog pattern from earlier in the build.
    New files: `types/admin-mile-operations.ts`, `lib/api/admin-mile-operations.ts`,
    `lib/hooks/use-admin-mile-operations.ts`.
  - `/admin/ho-operations` (HeadOfficeOperations — folded into one page, 3 tabs: Orders,
    Clearance, Reversal History; all three are straightforward read-only
    `makePaginatedResponse` lists, no envelope surprises here). New files:
    `types/admin-ho-operations.ts`, `lib/api/admin-ho-operations.ts`,
    `lib/hooks/use-admin-ho-operations.ts`.
  - Area-manager dashboard (AreaManagerDashboard module) — **folded into `/admin/dashboard`**
    rather than given its own route, per the original inventory's own suggestion ("role-gated
    view"). Added a `RegionalDashboardCard` gated on `hasPermission("view-regional-dashboard")`
    (the exact permission the backend's `getStatusesCount`/`refreshData` endpoints check) so
    it only renders for staff who actually have regional/area-manager access, right below the
    existing operation-dashboard cards. New files: `types/admin-area-manager.ts`,
    `lib/api/admin-area-manager.ts`, `lib/hooks/use-admin-area-manager.ts`.
  - Added nav entries for all of the above (Sorting, Mile Operations, HO Operations) under
    the existing admin "Operations" nav section — no new sections needed. Area-manager has
    no separate nav item since it lives inside the existing Dashboard page.

  **The full priority list in this file is now checked off.** `npm run build` is green at
  35 routes (up from 17 at the very start of the build), `npm run lint` is at the same 3
  pre-existing baseline errors it started this session with (all in files this build never
  touched: `components/charts/sparkline.tsx`, `components/layout/portal-shell.tsx`,
  `providers/auth-provider.tsx`) — no lint regressions introduced across the entire session.

  **What's left / natural next steps for a future session** (nothing here was on the
  original priority list — these are things noticed along the way and deliberately deferred,
  listed roughly in the order they'd likely matter most):
  1. The ~30 bespoke synchronous report endpoints in `Modules/Reports`' `ReportsController`
     (audit, sales, branch-progress, finance, sorting reports, etc.) — only the generic
     async report-history/queued-reports flow was wired; these would each need their own
     DTO/field inspection.
  2. `/admin/branch-finances`' expense-approval sub-workflow and deposit create/edit/accept-
     payment flows — only list/view/approve/reject deposit were wired.
  3. `Modules/OtherOperations`' hardware-scanner flows (bucket open/close, device settings,
     bags, hold-orders) — deliberately out of scope, see above.
  4. Invoice detail drill-down + print for customer `/finances` (`invoices-view`,
     `invoices-view-setoff`, `print-invoices`).
  5. `/admin/packages/new` only supports auto-assigned waybills, not manual — see Session 2
     notes for why.
  6. Payment-slip file upload on the rider-finances make-payment dialog.
  7. Client-user management (`ClientUserController`), client-profile-update-request review
     (`ClientProfileController`), client announcements (`ClientNotifyController`), and the
     client-side waybill-request UI (`ClientWaybillController`) from the `Clients` module —
     noted as out-of-scope back in the `/admin/clients` session, still true.
  8. `webhook` + barcode printing on customer `/shipments` (stretch goal from the very first
     session, never revisited).

  **Systemic gotcha recap for whoever picks this up next** (six confirmed distinct envelope
  shapes found across this build — always read the actual controller method before assuming
  a response shape, never infer it from the route list alone):
  1. Named-key single-resource "get" → `pickKey(unwrap(res), "keyName")`.
  2. Bare numeric-list single-resource "get" (`'data' => [$model]`) → `unwrap(res)` gives
     `[{key:0, value:$model}]`, read `.value` directly (Reasons, Zones, Messages).
  3. A controller method that calls `response()->json([...])` directly, skipping
     `APIHelper`/`convertToAPIData` entirely, but keeping the standard-ish
     `{success, data, ...}` shape (Reports module, Sorting dashboard — each with slightly
     different top-level keys, don't assume they match each other either).
  4. A list action that hand-rolls its own pagination block with different field names than
     the standard `{current_page,last_page,per_page,total}` (RiderFinances) — remap to the
     standard `Pagination` type so the shared `<Pagination>` component keeps working.
  5. `pickKey()`/`unwrap()` from `lib/api/client.ts` only apply to the standard
     `APIHelper::makeAPIResponse` envelope — never assume they apply without confirming the
     controller method actually calls `makeReturn()`/`makePaginatedResponse()`.
  6. Real file downloads (Excel/PDF) need `responseType: "blob"` + a client-side anchor
     trigger, since the bearer token can't ride along on a plain navigation — see
     `downloadReportExcel()` in `lib/api/admin-reports.ts` for the pattern to reuse.

  **Session 5 addendum — three more envelope/status-code surprises, confirmed live against
  the real backend (not just read from source):**
  7. A controller can call `DataTables::collection(...)->make(true)` (Yajra) and return that
     directly — `convertToAPIData` then iterates the resulting `JsonResponse` object's
     *public properties* (`headers`/`original`/`exception`), not its JSON body, so the real
     payload ends up nested at `data.original.data` alongside two layers of noise. Only
     confirmed example so far: `sorting-buckets/device-settings`. Always live-test rather
     than trust a controller read alone when you see `DataTables::` in the method body.
  8. Some endpoints return a non-2xx HTTP status *on purpose* for an expected/valid state, not
     an error — `bags/current` returns HTTP 400 (not 200) with `data.bag = null` when there's
     simply no active bag. Axios throws on this by default; catch it and branch on the status
     code rather than letting it bubble as a generic error.
  9. At least one `makeReturn()`-based list endpoint returns its array double-wrapped
     (`data: [[...]]`, one array containing one array, instead of `data: [...]`) —
     `reports/branch-order-pending`. Handle generically: if `data.length === 1 &&
     Array.isArray(data[0])`, unwrap one level.

- **Session 4 — real browser QA pass (Playwright).** The owner explicitly asked for actual
  browser-loaded QA, not just curl/HTML-shell checks (curl can't see console errors, React
  hydration issues, or broken layout). Installed `@playwright/test` as a devDependency
  (`npm i -D @playwright/test && npx playwright install chromium` — Chromium was already
  cached on this machine) and wrote a throwaway sweep script, `scripts/qa-sweep.mjs` (not a
  permanent test suite — kept for re-use if a future session wants to re-run it, but it's
  not wired into CI or `npm test`). `scripts/qa-output/` (screenshots + `summary.json` +
  `run.log`) is gitignored (`.gitignore` updated) since it's disposable local QA output.

  **What the script does:** seeds a forged session into both `localStorage`
  (`sx_token`/`sx_secret`/`sx_session`, matching exactly what `persistSession()` in
  `lib/auth/session.ts` writes — a fake but structurally-valid unsigned JWT via
  `decodeJwt`, which never verifies the signature) and cookies (`sx_token`/`sx_guard`, what
  `proxy.ts` actually gates on), for both a `staff` and a `client` guard context, with a
  permission list broad enough to cover every `hasPermission(...)` check in the app (so
  conditional buttons/dialogs render during the sweep). It then drives real Chromium through
  **all 37 distinct pages** (every `page.tsx` in the app — dynamic routes hit with a
  representative id) **+ 9 create/edit dialog interactions** (opening the "New X" dialog on
  branches/drivers/staff/roles/reasons/waybills/locations, the packages detail page's
  "Update Status" dialog, and the customer "Request Pickup" dialog), capturing console
  errors/warnings, uncaught page exceptions, failed network requests, and a full-page
  screenshot per check — 46 checks total.

  **Environment gotchas hit and fixed along the way** (worth knowing for next time):
  - First attempt used `waitUntil: "networkidle"` — this **never fires in `npm run dev`**
    because Turbopack's HMR keeps a persistent WebSocket open, so every route timed out at
    the full 20s budget. Switched to `waitUntil: "load"` + a fixed settle `waitForTimeout`
    instead (bumped to 4s for routes / 3s before dialog clicks after the first real run
    showed TanStack Query's retry+backoff sometimes taking longer than a shorter wait to
    settle into its final state — see below).
  - Even against dev mode, one run genuinely hung on `/admin/drivers` for 500+s with no
    Playwright-side timeout firing at all (should be impossible given a 15s `goto` timeout
    is enforced Node-side, not browser-side) — never fully explained, but a second run
    against the same dev server hung on a *different* route (`/admin/packages`) instead of
    the same one deterministically, which is strong evidence this was environmental
    (system/CPU contention from the sheer number of other processes running, not a
    reproducible app bug) rather than an infinite loop in the app itself. **Fixed by testing
    against a production build instead** (`npm run build && npm run start`) rather than
    `npm run dev` — this eliminates Turbopack HMR entirely as a variable and is arguably the
    more representative target for QA anyway. Also hardened the script itself with a
    25-second watchdog (`Promise.race` per route) so one hung check can never again stall
    the whole sweep — it now always degrades to "watchdog timeout, move on" instead.
    **Against the production build, zero watchdog timeouts occurred across two full runs.**
  - Two bugs in the sweep script itself, not the app: (1) the crash-reporting loop at the
    end assumed every result entry had `consoleErrors`/`pageErrors` arrays, which
    watchdog-timeout entries don't have — crashed with `Cannot read properties of undefined
    (reading 'map')` right after writing `summary.json` (so the real data was still
    captured, just the pretty-print crashed) — guarded with `?? []`. (2) The customer
    "create pickup" dialog check pointed at `/admin/pickups` (the *staff* pickups page) with
    a `client`-guard context and the wrong button label (`"New Pickup Request"` instead of
    the real `"Request Pickup"`) — fixed to `/pickups` + the correct label.

  **Final clean run (production build): 46/46 checks, 0 page errors, 0 watchdog timeouts,
  0 console errors other than the expected `net::ERR_CONNECTION_REFUSED` noise from every
  attempted API call (no backend running, exactly as expected).** The one dialog check that
  didn't find its button (`/admin/packages/1` → "Update Status") was manually verified with
  a longer wait to be **correct behaviour, not a bug**: there's no real order with id `1`,
  so the page's error-state branch renders ("Couldn't load this package...") instead of the
  order-detail branch that contains the button — confirmed via an isolated recheck script
  (deleted afterward, not a deliverable).

  **Real bugs found by actually looking at the screenshots (not just checking for zero
  console errors) — all fixed:**
  1. `components/customer/status-stat-cards.tsx` (`StatusStatCards`, prior session's code) —
     returned `null` on *any* falsy `data`, including the error case, not just "genuinely
     empty." On the customer dashboard this left a large unexplained blank gap where the
     status-count cards should be, with zero indication anything had failed. Added an
     `isError` branch with a proper "Couldn't load your order status summary right now."
     message.
  2. `components/admin/client-settings-tab.tsx` (`RegisteredDetailsCard` and `TrainingCard`
     — my own code from the `/admin/clients` build session) — same bug, same root cause:
     destructured `{ data, isLoading }` without `isError`, so an error silently fell through
     to `if (!data) return null`. Added `isError` handling with friendly messages to both,
     matching the sibling `WaybillSettingsCard` in the same file which already had it right
     (so this was an inconsistency within my own file, not a design gap).
  3. `app/(customer)/profile/page.tsx` (Account tab, prior session's code) — minor version of
     the same pattern: silently rendered nothing on error while the sibling "Profile" tab in
     the same file correctly showed "Could not load profile." Made the Account tab consistent.
  4. `app/admin/(portal)/reports/page.tsx` (my own code, this build) — a *different* flavor
     of the same root issue: the summary-cards section didn't silently disappear, it showed
     **fabricated "0" values** for total/pending/completed/failed report counts on error
     (via `summary?.field ?? 0` with no `isError` branch at all) — which is arguably worse
     than a blank gap, since "0 reports, 0 failed" reads as genuine data ("we checked, there
     are none") rather than "we couldn't check." Added an `isError` branch with a clear
     message instead of falling through to the fabricated-zero render.

  **Pattern for the next session to watch for:** any component that does
  `const { data, isLoading } = useSomeQuery(...)` (no `isError`) and then branches only on
  `isLoading` / truthiness of `data` — on a real network failure this always reads as
  "empty" or "zero," never as "failed," which is misleading or silently-blank depending on
  the fallback. `grep -n "isLoading } = use"` (or similar) across `app/` and `components/`
  is a fast way to spot candidates; every hit found this session was checked and either
  fixed or confirmed already-safe (e.g. `client-api-tab.tsx` already destructured `isError`
  correctly; `shipments/[id]/page.tsx` already has a generic "Order not found." fallback
  which is an acceptable, if less precise, safe default).

  Rebuilt (`npm run build`) and restarted the production server after every fix, then
  re-ran either the full sweep or a targeted isolated check to confirm each fix actually
  rendered correctly before moving on — screenshots for the two harder-to-verify fixes
  (`status-stat-cards`, reports summary) were visually confirmed showing the intended error
  message with no fabricated data and no blank gap. `npm run build` / `npm run lint` stayed
  green throughout (still the same 3 pre-existing baseline lint errors, no new ones).

  **Process hygiene:** confirmed no orphaned dev servers or stray Playwright/Chromium
  processes were left running at any point this session (checked via `Get-CimInstance
  Win32_Process` + `Get-NetTCPConnection` on port 3000 — only ever one server process tree
  at a time). Left the app running under `npm run start` (production mode, port 3000) at
  the end of this session rather than `npm run dev`, since that's what the final verified
  QA pass ran against — a future session picking this up should be aware it's not in dev
  mode and restart with `npm run dev` if actively developing.

  **What's next:** the deferred-backlog list a few sections up (the ~30 bespoke report
  endpoints, branch-finances expense-approval workflow, warehouse-scanner hardware flows,
  invoice drill-down, manual waybills on package creation, payment-slip upload, client-user/
  profile-request/notify management, shipment webhook/barcode printing) — nothing new was
  added to it this session, this was purely a QA-and-fix pass on what already existed.

- **Session 5 (this one) — owner asked to "finish the frontend completely, cover all
  endpoints," i.e. work through the entire deferred-backlog list above, not just a subset.**
  A live backend is now available (WSL `artisan serve` + the real legacy DB, see "Live
  backend now available" section) with two demo accounts (`qa-demo@sribeesexpress.local` /
  staff, `qa-demo-client@sribeesexpress.local` / client). Confirmed both backend
  (`curl localhost:8000/api/v1/dropdown/cities` → 200) and frontend (port 3000, production
  build) were already running on arrival.

  Given the size of the remaining list, used 4 parallel read-only research agents up front to
  extract exact routes/DTOs/response shapes from the backend for: (1) the Reports module's
  ~30 bespoke endpoints, (2) BranchFinances + RiderFinances gaps, (3) OtherOperations
  (hardware-scanner flows), (4) the Clients module's four unbuilt controllers — then
  implemented everything directly, myself, using those findings (no code was written by the
  research agents, they were read-only fact-finding only).

  **Backlog items completed this session (checked off below):**
  - **#5 Manual waybill on `/admin/packages/new`.** Added a toggle-chip "Auto-assign /
    Enter manually" control; manual mode POSTs to `/v1/orders/create`
    (`SingleOrderManualWaybillDTO`, adds a `waybill_id` field validated client-side against
    the exact same regex the backend uses). New: `createAdminOrderManualWaybill()` in
    `lib/api/admin-orders.ts`, `useCreateAdminOrderManualWaybill()` hook. Edited
    `components/forms/create-admin-order-form.tsx`.
  - **#6 Payment-slip upload on rider-finances make-payment.** `makeDepositPayment()` now
    always sends `multipart/form-data`; added `payment_slip` (File, optional) to
    `MakePaymentPayload`. UI: deposit amount is now a locked/read-only field (backend
    rejects any amount that doesn't exactly equal the deposit's `collected_cod_amount` —
    letting it be free-text was a footgun), transaction number is conditionally required for
    non-cash/non-other methods (matching `MakePaymentRequest::withValidator`), added a file
    input (accepts jpeg/png/pdf, notes the 5MB limit). Edited
    `app/admin/(portal)/rider-finances/[id]/page.tsx`, `lib/api/admin-rider-finances.ts`,
    `types/admin-rider-finance.ts`.
  - **#2 `/admin/branch-finances` expense-approval + deposit create/edit/accept-payment.**
    Added a second "Expense Approvals" tab (list via `approve-branch-expense/list`, filtered
    by `expense_status`; detail page at `/admin/branch-finances/expenses/[id]` showing
    `approve-expense/view/{id}` with Approve/Reject). Added "New Deposit" (multipart create,
    branch → waybill multi-select sourced from `branch-waybill-id`, expense type from a new
    `getExpenseTypesDropdown()`, optional deposit-slip file) and, on the deposit detail page,
    "Add expenses" (edit/update flow — dynamic expense-line rows, resubmits for approval) and
    "Accept payment" (payment-date + the two hardcoded `deposit_type` literal strings the
    backend accepts). New files: none (extended existing `types/admin-branch-finance.ts`,
    `lib/api/admin-branch-finances.ts`, `lib/hooks/use-admin-branch-finances.ts`,
    `components/forms/branch-deposit-form-dialog.tsx` added). Note: neither the deposit
    detail view (`branch-deposit/view/{id}`) nor edit-info (`branch-deposit/edit/{id}`)
    endpoints return a `status` field on the deposit itself, so — matching this file's own
    established convention from Session 2 ("shown to any authenticated staff user, matching
    backend behaviour, not gated further") — the Edit/Accept-Payment buttons are gated on
    permission only, not on deposit status; the backend enforces valid-transition rules
    itself (e.g. `AcceptPaymentAction`/`BranchDepositUpdateAction` reject invalid states).
  - **#4 Invoice detail drill-down + print for customer `/finances`.** New
    `/finances/[id]` page (tabs: Orders in this invoice via `invoices-view/list`, Setoff
    invoices via `invoices-view-setoff/list`) plus a "Print invoice" button opening
    `/print/invoice/[id]` — a standalone route (new `app/print/layout.tsx`, no `PortalShell`,
    still `AuthGuard`-gated) rendering `print-invoices/{id}` (`PrintInvoiceAction`) as a clean
    printable document (`window.print()`). Added `/print` to both `CUSTOMER_PREFIXES` and the
    `matcher` array in `proxy.ts` (per the standing "both places" gotcha). **New envelope
    quirk found**: `PrintInvoiceAction::getTaxDetails()` builds a PHP array via `$arr[] = ...`
    (sequential int keys) then appends a `$arr['total_tax'] = ...` (string key) — this makes
    the array no longer a PHP "list", so `json_encode` serializes it as a JSON **object**
    (`{"0":{...},"1":{...},"total_tax":150}`), not an array — on top of the outer response
    already being reshaped by `convertToAPIData` into a named-key list. Modeled as
    `PrintInvoiceTopLevelTaxDetails = Record<string, unknown>` in `types/finance.ts` and
    unwrapped defensively in the print page (`Object.entries(...).filter(([k]) => k !== "total_tax")`)
    rather than trusting a fixed array shape.
  - **#8 Webhook + barcode printing on customer `/shipments`.** Added a "Webhook settings"
    dialog (two tabs: Status mapping — prefilled from `GET webhook/list`, one text input per
    `key_N` status code the backend accepts, labeled via the existing client
    primary-status-type dropdown; Order mapping — **write-only**, the backend has no "get"
    endpoint for `UpdateOrderMappingDTO`'s config, so this form always starts blank and the
    UI says so explicitly rather than pretending to load existing values). Added a per-row
    "Print barcode" button linking to a new `/print/barcode/[id]` route (order id in the URL,
    `?extra=2,3,4` supported for a batch) that fetches `client-barcodes/print-barcode` and
    renders real Code128 barcodes via `jsbarcode` (added as a new npm dependency — no
    existing barcode-rendering capability in the project; confirmed npm registry reachable
    before installing). New: `types/webhook.ts`, `lib/api/webhook.ts`,
    `lib/hooks/use-webhook.ts`, `components/customer/webhook-settings-dialog.tsx`,
    `types/barcode.ts`, `lib/api/barcode.ts`, `lib/hooks/use-barcode.ts`,
    `components/shared/barcode-label.tsx`. Deliberately **not** wired: the separate
    `client-barcodes/list` endpoint — it returns effectively the same order rows already
    shown on `/shipments`' existing table (same `BarCodeListDTO`/near-identical query to the
    orders list), so a second redundant list view wasn't built; the per-row print action on
    the existing table covers the actual "print a barcode" use case.
  - **#7 Clients module: client-user management, profile-request review, announcements,
    client-side waybill requests.** All four unbuilt `Clients` module pieces:
    - `/admin/clients/users` (new top-level page, not nested under a specific client) —
      `ClientUserController`'s list/get/update/toggle-status. **Deliberately did not filter
      the list by a specific client's id**: the DTO's `client_id` filter validates
      `exists:client_users,id` (not `clients,id` — looks like a backend bug per the research
      pass), so scoping this page under `/admin/clients/[id]` and filtering server-side would
      404/422 unpredictably; used the working text filters (`client_name`/`client_username`/
      `email`) instead and kept it as its own nav entry. No create endpoint exists on the
      backend for client sub-users (staff-side or client-side) — matching that, there's no
      "New" button here, only edit + activate/deactivate.
    - `/admin/clients/profile-requests` (+ `/[id]` detail) — `ClientProfileController`'s
      review queue. The backend has **no reject endpoint** — approving is the only reviewer
      action, and "approving" means resubmitting the entire `UpdateClientProfileDTO` payload
      (not a simple status toggle), so the detail page is a prefilled, editable form that
      submits back to `client-profiles/update/{id}`. `business_type` is shown read-only and
      deliberately **not** included in the resubmit payload: `getClientProfile` returns it as
      an array of human-readable labels, but the approve DTO expects an array of enum *keys*
      — round-tripping the labels back verbatim would fail validation (or worse, silently
      write the wrong thing if a label happened to collide with a key), so it's left for the
      backend/DB to reconcile rather than guessed at.
    - `/admin/clients/announcements` (+ `/[id]` detail) — `ClientNotifyController`. Create
      dialog sends to selected clients via email and/or SMS (chip toggle for channel,
      `MultiSelect` for recipients, conditional required fields matching the backend's
      `validateNotifyData()` business rules). Noted in the UI that SMS *dispatch* is
      currently a no-op backend-side (`//SMSService::send(...)` is commented out in
      `CreateClientNotify`) — the request still succeeds and records the message, just
      doesn't actually text anyone yet. **Another envelope quirk**: `client-notify/view/{id}`
      returns a genuinely numeric-indexed PHP array under `data` (one entry per recipient),
      but since it goes through `makeReturn()` (not `makePaginatedResponse()`) it still gets
      `convertToAPIData`-reshaped into `[{key:0,value:row0},{key:1,value:row1},...]` even
      though it's a plain list, not an object — unwrapped by mapping `.value` off each entry
      in `getAdminClientNotify()`.
    - Customer `/waybill-requests` (new page + nav item) — `ClientWaybillController`'s
      list/create. Simple two-field form (`quantity`, `barcode_quantity`); noted the
      backend's one-request-per-day limit in the UI copy so the eventual 422 isn't a
      surprise. Confirmed via the research pass that the admin-side review of these same rows
      already exists — `Modules\Staff`'s `/waybill-request/*` endpoints (wired in an earlier
      session at `/admin/waybills`) operate on the identical `WaybillRequestRange` model the
      client's `create` inserts into, so no new admin-side page was needed for this one.
    - Added `/admin/clients/users`, `/admin/clients/profile-requests`,
      `/admin/clients/announcements` to the admin "Network" nav section; added
      `/waybill-requests` to the customer "Operations" nav section. Added `/waybill-requests`
      to both `CUSTOMER_PREFIXES` and `matcher` in `proxy.ts`.

  **Build/lint status after all of the above:** `npm run build` green at 47 routes (up from
  41 at the start of this session), `npx tsc --noEmit` clean, `npm run lint` unchanged at the
  same 3 pre-existing baseline errors (`sparkline.tsx`, `portal-shell.tsx`,
  `auth-provider.tsx`) — no new lint errors introduced across the whole session so far.

  Continuing on (still Session 5, no new session number): completed the remaining two
  backlog items — **#3 OtherOperations hardware-scanner flows** and **#1 the ~30 bespoke
  Reports endpoints** — plus a full live-backend QA pass on everything built this session.
  This closes out the entire 8-item deferred backlog from Session 4.

  - **#3 `Modules/OtherOperations` hardware-scanner flows.** Before writing any code,
    live-tested the real endpoints against the WSL backend with the staff demo account
    (`POST /v1/login/staff`, curl with the bearer token) rather than trusting the research
    pass alone — this caught real details the source-reading missed:
    - `sorting-buckets/device-settings` (GET) really is as broken-looking as the research
      guessed: the controller's `DataTables::collection(...)->make(true)` call returns a
      `JsonResponse` object, and `convertToAPIData`'s `foreach` iterates that object's
      *public properties* (`headers`, `original`, `exception`), not its JSON body — live
      response confirmed `data.original.data` is where the real
      `{id, bucket_name, device_url, parent_bucket}` rows actually live (80 real rows came
      back). `getDeviceSettings()` in `lib/api/admin-sorting.ts` unwraps exactly that path.
    - `sorting-buckets/open`'s `sorting_center_id` has **no lookup/dropdown endpoint
      anywhere** (grepped every module's routes) — confirmed by live-testing: guessed `1`
      based on it being the obvious first id, and it worked (`"sorting_center":{"id":1,
      "name":"COLOMBO SORTING CENTER"}` came back in the opened bucket's nested relations).
      The UI still can't offer a real dropdown, so `sorting_center_id` is a plain numeric
      input with an explicit "no lookup endpoint exists yet" note — but `sorting_section_id`
      *can* be populated live once a center id is entered, via
      `get-buckets?sorting_layer_id=<that number>` (confirmed working, despite the
      misleading param name — it validates as a `sorting_center` id, not a `sorting_layers`
      id).
    - **A real backend bug found via live-testing** (not fixed, flagged only, matching the
      standing "don't touch backend/" rule): `POST /v1/sorting-buckets/close` 500s —
      `SortingBucket::closeBucket()` (`Modules/OtherOperations/app/Models/SortingBucket.php`)
      references a `bags.closed_at` column that doesn't exist in the live DB yet
      (`SQLSTATE[42S22]: Column not found: 1054 Unknown column 'closed_at'`). This matches
      the "one pending migration" the DB is already known to be missing (see "Live backend
      now available" above) — almost certainly that exact migration. **Consequence for the
      QA demo account**: while confirming the open-bucket flow worked, a real bucket (id 98)
      was opened on `qa-demo@sribeesexpress.local` and could not be closed afterward because
      of this bug — it's still sitting open on that account. This means
      `hasOpenBucket()`-gated actions (a new `open` call) will likely reject with "you
      already have an open bucket" for that account until either the migration lands or
      someone closes bucket 98 directly in the DB. Not a frontend bug, nothing to fix here —
      just noted so the next session isn't surprised by it.
    - Scoped down per the original inventory's own framing ("lowest priority, warehouse-floor
      tooling") but wired every endpoint that has a real web-admin use case: buckets
      list/open/close (`/admin/sorting` → Buckets tab), hold-orders list/hold + the separate
      but functionally-identical `other-operations/bucket-close` list/hold pair folded into
      the same "Hold Orders" tab (`ho-operation` + `sorting-bucket-close` permission-gated
      "End of shift" button added there too — a genuinely distinct action from per-bucket
      close, ends the whole shift and triggers a `clear-sorting-process` Artisan command),
      device settings list + edit (Device Settings tab), and current-bag view + start-new-bag
      (Bags tab, `GET bags/current` returns **HTTP 400** — not 200 — with `data.bag=null`
      when there's no open bucket, confirmed live; handled as "no active bag" rather than a
      hard error, not a crash). New files: `components/admin/sorting-buckets-tab.tsx`,
      `sorting-hold-orders-tab.tsx`, `sorting-device-settings-tab.tsx`, `sorting-bags-tab.tsx`;
      extended `types/admin-sorting.ts`, `lib/api/admin-sorting.ts`,
      `lib/hooks/use-admin-sorting.ts`, `app/admin/(portal)/sorting/page.tsx` (now 5 tabs:
      City Confirmation, Buckets, Hold Orders, Device Settings, Bags).

  - **#1 The ~30 bespoke `Modules/Reports` `ReportsController` endpoints.** Rather than
    hand-writing ~30 bespoke row-type interfaces and ~30 near-identical page sections,
    confirmed (via the research pass, then live-verified a sample) that **~29 of the 36
    actions call `makePaginatedResponse()`** — standard envelope, `data` is a raw row array
    with real backend field names, no reshaping. That's generic enough to drive from one
    data-driven registry + one dynamic-column table component instead of ~30 bespoke ones:
    - `types/admin-bespoke-report.ts` + `lib/admin-bespoke-report-registry.ts` — a
      `BespokeReportDef[]` registry (id, permission(s), endpoint path, filter-field specs,
      optional `pathParams` for the handful of `.../list/{param}` or `.../view/{a}/{b}`
      routes) covering all 29 paginated endpoints, grouped into the same 6 categories the
      original inventory used (Administrative, Status Detail, Clearing & Pending, Status
      Count, Finance, Sorting).
    - `components/shared/dynamic-table.tsx` — a reusable table that reads columns off
      `Object.keys(rows[0])` (generalized from the pattern the async report-history detail
      dialog already used inline) instead of a hand-typed column config; handles
      object/array cell values by JSON-stringifying rather than crashing.
    - `components/admin/bespoke-report-filters.tsx` — one filter-field renderer dispatched
      by declared type (`branch`/`client`/`staff`/`primary-status`/`sorting-layer` →
      `Combobox` wired to the existing dropdown hooks; `daterange` → two date inputs joined
      into the backend's `"Y-m-d - Y-m-d"` string format; `date`/`text`/`number`/`month-name`/
      `select` → plain inputs).
    - `components/admin/bespoke-reports-tab.tsx` — the report picker (category → report
      selects, gated per-report by `hasPermission`) + run button + `DynamicTable` +
      pagination, added as a second tab ("Bespoke Reports") alongside the existing async
      report-history flow (now "Async Reports") on `/admin/reports`.
    - The remaining ~7 non-paginated (`makeReturn()`-based) endpoints wired individually,
      not through the registry: the `audit` mark-as-audited mutation (small widget attached
      above the `audit-list` report when selected), 2 stat-tile dashboards
      (`client-count/dashboard`, `pending-invoice/dashboard` — always-visible cards above the
      picker), `sorting-center-branch` (a small always-visible lookup card), and the
      sorting-report create/view/delete trio (wired around the `sorting-reports-list`
      report specifically — "New sorting report" button + per-row View/Delete actions via
      `DynamicTable`'s new optional `rowActions` render prop).
    - **One more confirmed shape bug, generalized rather than special-cased**:
      `branch-order-pending`'s `data` comes back double-wrapped (`[[...]]`, an array
      containing one array, instead of `[...]`) per the research pass — `fetchBespokeReport()`
      in `lib/api/admin-bespoke-reports.ts` detects "exactly one row, and that row is itself
      an array" and unwraps it, so this doesn't need a per-report special case.
    - Path-param drill-down reports (`client-count/list/{yearmonth}`,
      `sales-report/view/{year}/{month}`, `inactive-client-count/list/{count}`) are wired as
      ordinary registry entries with a required text/select filter feeding the URL path
      segment(s) — not auto-linked from their parent summary report's rows (no row-click
      handler was added), so reaching them means manually typing/selecting the drill-down key
      rather than clicking through. Flagged as the one piece of "full drill-down UX" not
      done, in case a future session wants to wire row-click-to-drill-down.

  **Live end-to-end QA pass (this is the part that matters most for a build previously only
  checked against `npm run build`/`lint`/curl-with-forged-cookies)**: confirmed both the WSL
  backend (`curl localhost:8000/api/v1/dropdown/cities` → 200) and the frontend were already
  running on arrival; rebuilt (`npm run build`) and restarted the frontend under
  `npm run start` (production mode — required, see "Live backend now available") after all
  changes above. Wrote `scripts/qa-session5.mjs` (throwaway, kept for reuse like
  `qa-sweep.mjs`) — **real login** via the actual `/admin/login` and `/login` forms with the
  `qa-demo@sribeesexpress.local` / `qa-demo-client@sribeesexpress.local` accounts (not forged
  session cookies, since a real backend is available now), then visits every new page from
  this session, clicks through every new tab, and captures console errors + page exceptions +
  screenshots.

  - **First full run: 12/12 checks, 0 console errors, 0 page exceptions** across every new
    admin and customer page (branch-finances both tabs, client-users, profile-requests,
    announcements, all 5 sorting tabs, both reports tabs, packages/new with the manual-waybill
    toggle, customer finances, waybill-requests, shipments + the webhook dialog).
  - Screenshots visually confirmed correct rendering: nav sidebar shows all new items in the
    right sections, tabs switch correctly, the manual-waybill toggle on `/admin/packages/new`
    reveals the waybill input with the right placeholder/regex hint, the webhook settings
    dialog opens with its two sub-tabs.
  - Chased down why several screenshots still showed skeleton loaders after 6-8s waits: a
    network-trace script confirmed this is **exactly** the documented single-threaded
    `artisan serve` slowness — a single login request took ~13s, a single list request took
    ~12.6s, both eventually returning clean `200`s with correct data. Not a bug; just needed
    longer waits to see the final state, matching the standing "don't assume a page is buggy
    just because it's slow under `artisan serve`" guidance from the "Live backend now
    available" section.
  - Verified real-data rendering end-to-end for the two trickiest fixes with longer waits:
    `/admin/clients/users` (client-users list) and `/admin/sorting` → Device Settings both
    resolved to fully-populated tables with real rows, confirming the envelope-unwrap logic
    is correct against live data, not just against the research pass's static analysis.
  - **Found a third real backend bug, live**, on the invoice-print feature specifically:
    `GET /v1/client-finances/print-invoices/{id}` 500s with `ParseError: Unclosed '{' on line
    202` in `PrintInvoiceAction.php`. Read the file directly to confirm — it's not a
    hypothetical, the file genuinely ends at line 220 (`return $setoffDetails;`) with **no
    closing brace for `getSetoffDetails()` and no closing brace for the class itself** — a
    truncated/incomplete file already in this state before this session touched anything (no
    prior session had live-tested this endpoint, since there was no live backend until
    Session 5). Confirmed via curl with a real client token (`qa-demo-client`, real invoice
    id 8 belonging to client id 1). **Flagged only, not fixed** — same standing rule as the
    other two known backend bugs (`operation-dashboard-status`'s `json_decode` bug, and
    `bags.closed_at` above); tempting as a one-line brace fix would be, `backend/` stays
    untouched. **Confirmed the frontend degrades gracefully**: `/finances/8` (the invoice
    detail page, driven by the *working* `invoices-view`/`invoices-view-setoff` endpoints)
    renders real order rows perfectly (waybills, COD, commission, payable, all correct against
    live data); `/print/invoice/8` shows a clean "Couldn't load this invoice for printing.
    Check your connection and try again." message — no crash, no blank page, no fabricated
    data — exactly the intended `isError` fallback.

  **Final build/lint status**: `npm run build` green at 47 routes, `npx tsc --noEmit` clean,
  `npm run lint` unchanged at the same 3 pre-existing baseline errors
  (`components/charts/sparkline.tsx`, `components/layout/portal-shell.tsx`,
  `providers/auth-provider.tsx`) — no new lint errors introduced anywhere in Session 5.
  Left the frontend running under `npm run start` (production mode, port 3000) at the end of
  this session, same as Session 4 left it.

  **The entire 8-item deferred backlog from Session 4 is now complete.** See the updated
  checklist below.

  **Three real, confirmed backend bugs now on record for the backend team** (none fixed,
  none touched, per the standing rule):
  1. `GET /v1/dashboard/operation-dashboard-status` 500s (`json_decode()` on an
     already-decoded array) — found in Session 4/the live-backend session, still open.
  2. `POST /v1/sorting-buckets/close` 500s (`bags.closed_at` column doesn't exist — matches
     the one pending migration) — found this session; left a stray open bucket (id 98) on
     the `qa-demo@sribeesexpress.local` account as a side effect of testing.
  3. `GET /v1/client-finances/print-invoices/{id}` 500s (`PrintInvoiceAction.php` is missing
     its closing braces, a genuinely truncated/incomplete file) — found this session.

  **What's next**: nothing from the original priority list or the 8-item deferred backlog
  remains. Natural candidates for a future session, none of them requested by the owner so
  far: (a) drill-down row-clicks between the bespoke reports that have parent/child pairs
  (client-count → client-count/list, sales-report → sales-report/view, inactive-client-count
  → its list); (b) once the backend team fixes the 3 bugs above, spot-check the
  now-unblocked flows (operation dashboard, bucket-close, invoice printing) end-to-end again;
  (c) the ID-photo upload flow on `/admin/clients/[id]`'s Settings tab, flagged out-of-scope
  back in the original `/admin/clients` session and never revisited.
