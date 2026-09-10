# API gaps: what this frontend needs that the backend does not have

This app was written against a Laravel API and now talks to the FastAPI service
at `sribees-express-backend`. Of the ~205 distinct paths it used to call, **one**
existed on the new backend. This file is the honest ledger of what that cost.

The rule applied throughout: **never fake it.** A screen either talks to a real
endpoint or says it cannot. Empty arrays are not returned in place of missing
data — "you have no invoices" is a false statement about someone's account,
where an error is a true one.

Two mechanisms enforce that:

- `lib/api/unavailable.ts` — `unavailable("Feature")` throws
  `FeatureUnavailableError`, surfaced by the existing react-query error states.
- A request-interceptor guard in `lib/api/client.ts` rejects any path starting
  `/v1/` or `/admin/` before it leaves the browser. Those are Laravel-era URLs;
  the base URL already ends in `/api/v1`, so they could only ever 404. This is
  what keeps the ~24 unported admin modules honest without touching each file.

---

## Working end to end

| Area | Endpoints |
|---|---|
| Client + staff login, refresh, logout | `/identity/auth/{client,staff}/*` |
| Customer dashboard | `/client-portal/dashboard/summary` |
| Customer shipments: list, detail, history, create | `/client-portal/orders*` |
| Customer pickup requests: list, create | `/client-portal/pickup-requests` |
| City and status dropdowns | `/client-portal/{cities,order-statuses}` |
| Public parcel tracking | `/public/track/{waybill_id}` |

Three of those did not exist before this migration and were added to the
backend as part of it: the two client-portal catalogues (a customer literally
could not create an order without a city list) and public tracking.

## Deliberately removed from the UI

Each of these was a control that could not do what it appeared to offer. The
alternative was leaving a button that always errored.

| Removed | Why | To restore |
|---|---|---|
| Waybill / recipient search on the shipments list | The list endpoint filters by `status_key` only | Search parameters on `GET /client-portal/orders` |
| Monthly orders area chart | No time-series endpoint; the summary is current counts only | An orders-over-time endpoint |
| Cancel pickup request | No cancel route exists | `POST /client-portal/pickup-requests/{id}/cancel` |
| Webhook settings dialog | Webhooks live under `/ecommerce`, which authenticates by API key, not a portal login | Portal-authenticated webhook management, or documented API-key issuance |
| Vehicle type + order count on the pickup form | Not fields the request accepts | Add them to `ClientPickupRequestCreate` |
| Manual waybill entry, order reference, second phone, description, note on the new-shipment form | Not fields `ClientOrderCreate` accepts | Extend that schema |
| Recipient name / phone / address on public tracking | **Deliberate, not a gap.** Public + guessable waybill = do not publish PII | Nothing. Keep it out |
| Password-expiry warning at login | No expiry claim in the token | A claim, if the policy is ever real |
| Client-side permission checks | The API exposes roles, not permissions. `hasPermission()` returns true and lets the API's 403 decide | A permissions claim on `/me` |

## Admin area: ported and not

**Ported and working against the API** (verified end to end — see
`scripts/e2e-admin-portal.mjs`):

| Screen | Endpoints |
|---|---|
| Operations dashboard | `/analytics/dashboard/status-counts` |
| Packages list + detail | `/shipments/orders*`, incl. status transitions |
| Assign rider (order and pickup) | `/fleet/orders/{id}/assign-rider`, `/shipments/pickup-requests/{id}/assign-rider` |
| Pickup operations | `/shipments/pickup-requests*` |
| Drivers | `/fleet/riders*` (read-only) |
| Notification settings | `/notifications/settings*` |

API modules also exist for `/geo` (zones, cities, branches, post offices),
`/warehouse` (bags, sorting buckets) and `/finance` (branch and rider deposits,
approve/reject) — `lib/api/admin-geo.ts`, `admin-warehouse.ts`,
`admin-finance.ts`. Their screens are not rewired yet, so those pages still
fail loudly via the interceptor guard.

**Removed from ported screens, because the endpoint does not exist:**

| Removed | Why |
|---|---|
| Create order as staff | `POST /shipments/orders` needs a `client_id` and nothing lists clients, so the form could not be filled in honestly. `/admin/packages/new` explains this instead of 404ing |
| Create / edit a driver | A rider is a Staff row; there is no staff CRUD endpoint |
| Order remarks, reversal history | No such data on this API. Per-transition `reason` is in the status timeline |
| KPI panel, regional overview | No KPI snapshot and no multi-branch rollup endpoint |
| Cancel / fail / receive pickup buttons | Replaced by one status control — the API takes a target status and validates it, so three buttons were three chances to disagree with the server |

**Known rough edges in what is ported:**

- The order status control reads the catalogue from `/client-portal/order-statuses`,
  which is client-authenticated, so it 403s for staff. The dialog says so
  rather than offering invented statuses. A staff-readable catalogue endpoint
  would fix it.
- Pickup target statuses are a local list for the same reason. The backend
  still validates them, so the worst case is an option that errors.
- Driver search filters in the browser because `/fleet/riders` is unpaged and
  has no search. Fine at this size, not at a few hundred riders.
- `/shipments/pickup-requests` has no limit/offset, so that list is unpaged.
- The staff order list filters by client **ID**, not name — there is no client
  lookup to resolve a name into one.

**Newly available, not yet wired up (backend shipped 2026-09-10).** These were
the four the business cannot operate without, and they now have endpoints:

| Screen | Endpoints |
|---|---|
| Staff / riders | `GET,POST /identity/staff`, `GET,PATCH /identity/staff/{id}`, `POST /identity/staff/{id}/password` |
| Clients (merchants) | `GET,POST /identity/clients`, `GET,PATCH /identity/clients/{id}` |
| Client users | `GET,POST /identity/clients/{id}/users`, `PATCH /identity/client-users/{id}`, `POST /identity/client-users/{id}/password` |
| Roles & permissions | `GET /identity/permissions`, `GET,POST /identity/roles`, `GET,PATCH,DELETE /identity/roles/{id}` |
| Barcode / label printing | `POST /shipments/labels` — batch of up to 500 order ids, returns label data; draw the barcode client-side from `waybill_id` |

Three consequences for this frontend:

- **`/admin/packages/new` can work now.** It was blocked because
  `POST /shipments/orders` needs a `client_id` and nothing listed clients.
- **Rider create/edit can come back** on `/admin/drivers`. A rider is a staff
  member holding the "Delivery Rider" role; `GET /identity/staff?role_name=Delivery+Rider`
  is the roster, and unlike `/fleet/riders` it is paged and searchable server-side.
- **`hasPermission()` can stop returning `true`.** The API exposes roles today,
  not permissions, so the honest interim remains "let the API's 403 decide" — but
  the 403s are now real. A permissions claim on `/me` would let the UI hide what
  it cannot do rather than offering it and failing.

**Decided: dropped.** Waybill inventory/requests (digital waybills make
pre-printed number blocks obsolete), the ~30 bespoke reports (replaced by a few
real reports plus CSV export), and announcements (email and WhatsApp do this
today). Delete these screens rather than leaving them failing.

**Decided: fold into existing screens rather than build.** "Order clearing" is
the rider-deposit ledger that `/finance` already has; "mile operations" is this
app's own parcels list with a multi-status filter and a bulk status action; "HO
operations" is finance plus `order_status_history`. Add the filter and the bulk
action to `/admin/packages` and delete those three modules.

**Still no backend, in build order:** manifests, profile requests, reason types.
Tax types and expense types are configuration tables, not modules.

Full reasoning for each of the above is in the backend's
`docs/SCALE_ROADMAP.md` §6.

## Also missing for the customer area

- **Profile** (`/profile`) — no endpoint to read or update a client user beyond
  `/identity/auth/client/me`.
- **Pricing** (`/pricing`) — rate cards are exposed to API-key merchants at
  `/ecommerce/rates`, not to portal users.
- **Finances** (`/finances`) — client invoices exist under `/finance/clients/
  {id}/invoices` but are staff-authenticated.
- **Waybill requests** (`/waybill-requests`) — no counterpart.
- **Barcode printing** (`/print/barcode/[id]`) — no label endpoint.

These pages still exist and still route; they surface the unavailable error
rather than rendering fabricated content.

## Operational note

`/public/track/{waybill_id}` is unauthenticated and waybills are sequential, so
enumeration is possible. It exposes no personal data by design, but it does
expose parcel volume. **It is now rate limited to 60 requests a minute per IP**
(backend, 2026-09-10), which bounds the harvest without fixing the underlying
guessability — a non-sequential waybill scheme is the actual fix and is
researched in the backend's `docs/SCALE_ROADMAP.md` §7.

Login is rate limited too: 30 attempts a minute per IP, and five *failed*
attempts per fifteen minutes per email address. A client hitting either gets a
429 with `Retry-After`, which the UI should surface as "too many attempts, try
again in N seconds" rather than as a generic error.
