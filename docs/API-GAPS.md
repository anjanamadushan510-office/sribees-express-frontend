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

## Not ported: the admin area

24 modules under `lib/api/admin-*.ts` still target Laravel URLs and fail fast
via the interceptor guard. Sorting them by whether the backend could support
them today:

**Has a backend, needs the module rewritten** — branches, cities, zones and
post offices (`/geo/*`), riders and rider assignment (`/fleet/*`), orders and
pickup requests (`/shipments/*`), branch and rider deposits, client invoices,
COD remittances (`/finance/*`), bags and sorting buckets (`/warehouse/*`),
reports and status counts (`/analytics/*`), notification settings
(`/notifications/*`).

**No backend at all** — manifests, mile operations, HO operations, order
clearing, client notifications, roles and permissions CRUD, reason types,
waybill inventory, bespoke reports, staff CRUD, client CRUD, barcode/label
printing, tax types, expense types, client profile-change approvals.

The second list is the real scoping question: those are Laravel features with
no counterpart, and each needs a decision about whether it is still wanted
before anyone writes the endpoint.

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

`/public/track/{waybill_id}` is unauthenticated and has no rate limiting in
front of it, so waybill enumeration is possible. It exposes no personal data by
design, but it does expose parcel volume. Tracked in the backend's
`docs/DEPLOYMENT.md` §7 alongside the other edge gaps.
