/**
 * Throwaway QA sweep script — NOT a permanent test suite.
 *
 * Drives a real Chromium browser (via Playwright) through every route in the
 * app, using forged localStorage/cookie auth (same trick used for the curl
 * QA passes earlier in this build) so pages render past the auth guard.
 * There is no live backend tonight, so every API call is expected to fail —
 * the point of this sweep is to catch *frontend* bugs: console errors,
 * uncaught exceptions, and visibly broken layout, not to validate data.
 *
 * Usage: `npm run dev` must already be running on http://localhost:3000.
 *   node scripts/qa-sweep.mjs
 *
 * Output: scripts/qa-output/<route-slug>.png screenshots + a JSON summary
 * printed to stdout and written to scripts/qa-output/summary.json.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "qa-output");
mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = "http://localhost:3000";

// A broad permission set covering every hasPermission(...) check in the app,
// so conditional buttons/dialogs render during the sweep instead of being
// hidden. Real authorization is still enforced server-side; this is purely
// for UI visibility during QA.
const ALL_PERMISSIONS = [
  "view-orders", "create-orders", "hold-status",
  "view-branches", "create-branches", "edit-branches", "active-branches", "de-active-branches",
  "view-rider", "create-rider", "edit-rider", "active-rider", "deactivate-rider",
  "view-pickup-request", "pickup-status-change", "view-pickup-dashboard",
  "view-client", "activate-client", "deactivate-client", "edit-client",
  "view-api-key-information", "generate-new-api-key", "update-client",
  "view-staff", "create-staff", "edit-staff", "activate-staff", "deactivate-staff",
  "user-role-edit",
  "request-waybill", "reject-waybill-request", "restore-waybill-request",
  "activate-waybill-request", "deactivate-waybill-request",
  "view-city", "create-city", "edit-city", "active-city", "deactivate-city",
  "view-zone", "create-zone", "edit-zone",
  "view-rider-deposit", "make-rider-deposit-payment", "approve-rider-deposit", "reject-rider-deposit",
  "view-deposit", "approved-deposit",
  "create-reason", "edit-reason", "delete-reason", "view-reason",
  "edit-sms", "active-sms", "de-active-sms", "view-sms",
  "view-report-history-dashboard",
  "ho-operation", "view-ho-clearance", "view-order-reversal-history",
  "view-regional-dashboard",
  "view-operation-dashboard",
  "client-view-invoices", "client-receivable-orders-report", "client-received-orders-report",
];

const STAFF_SESSION = {
  token: "qa-fake-staff-token",
  guard: "staff",
  user: { id: 1, name: "QA Staff", email: "qa-staff@example.com" },
  roles: ["Director"],
  permissions: ALL_PERMISSIONS,
  passwordExpired: false,
};

const CLIENT_SESSION = {
  token: "qa-fake-client-token",
  guard: "client",
  user: {
    id: 1,
    name: "QA Client",
    email: "qa-client@example.com",
    client_id: 1,
    client: { id: 1, way_bill_auto_generate: "Auto" },
  },
  roles: ["Client Admin"],
  permissions: ALL_PERMISSIONS,
  passwordExpired: false,
};

function fakeJwt(payload) {
  const b64 = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64(payload)}.fake-signature`;
}

/** Seed localStorage + cookies for a guard before any page script runs. */
async function seedAuth(context, session) {
  const secret = fakeJwt({
    user: session.user,
    guard: session.guard,
    role: session.roles,
    permissions: session.permissions.map((authority) => ({ authority })),
    passwordExpired: false,
  });

  await context.addCookies([
    { name: "sx_token", value: session.token, url: BASE_URL },
    { name: "sx_guard", value: session.guard, url: BASE_URL },
  ]);

  await context.addInitScript(
    ({ session, secret }) => {
      localStorage.setItem("sx_token", session.token);
      localStorage.setItem("sx_secret", secret);
      localStorage.setItem("sx_session", JSON.stringify(session));
    },
    { session, secret }
  );
}

// Routes to sweep: [path, guard]. guard is "staff", "client", or null (public).
const ROUTES = [
  ["/", null],
  ["/track", null],
  ["/login", null],
  ["/admin/login", null],

  ["/dashboard", "client"],
  ["/shipments", "client"],
  ["/shipments/new", "client"],
  ["/shipments/1", "client"],
  ["/pickups", "client"],
  ["/pricing", "client"],
  ["/profile", "client"],
  ["/finances", "client"],

  ["/admin/dashboard", "staff"],
  ["/admin/packages", "staff"],
  ["/admin/packages/new", "staff"],
  ["/admin/packages/1", "staff"],
  ["/admin/pickups", "staff"],
  ["/admin/branches", "staff"],
  ["/admin/drivers", "staff"],
  ["/admin/clients", "staff"],
  ["/admin/clients/1", "staff"],
  ["/admin/staff", "staff"],
  ["/admin/roles", "staff"],
  ["/admin/waybills", "staff"],
  ["/admin/locations", "staff"],
  ["/admin/rider-finances", "staff"],
  ["/admin/rider-finances/1", "staff"],
  ["/admin/branch-finances", "staff"],
  ["/admin/branch-finances/1", "staff"],
  ["/admin/manifests", "staff"],
  ["/admin/order-clearing", "staff"],
  ["/admin/settings/reasons", "staff"],
  ["/admin/settings/notifications", "staff"],
  ["/admin/reports", "staff"],
  ["/admin/sorting", "staff"],
  ["/admin/mile-operations", "staff"],
  ["/admin/ho-operations", "staff"],
];

// Extra interactions to open create/edit dialogs on a handful of the new
// list pages, per the "detail pages/dialogs where practical" ask.
const DIALOG_CHECKS = [
  { route: "/admin/branches", guard: "staff", button: "New Branch", slug: "admin-branches__new-branch-dialog" },
  { route: "/admin/drivers", guard: "staff", button: "New Driver", slug: "admin-drivers__new-driver-dialog" },
  { route: "/admin/staff", guard: "staff", button: "New Staff", slug: "admin-staff__new-staff-dialog" },
  { route: "/admin/roles", guard: "staff", button: "New Role", slug: "admin-roles__new-role-dialog" },
  { route: "/admin/settings/reasons", guard: "staff", button: "New Reason", slug: "admin-settings-reasons__new-reason-dialog" },
  { route: "/admin/waybills", guard: "staff", button: "New Request", slug: "admin-waybills__new-request-dialog" },
  { route: "/admin/locations", guard: "staff", button: "New City", slug: "admin-locations__new-city-dialog" },
  { route: "/admin/packages/1", guard: "staff", button: "Update Status", slug: "admin-packages-1__update-status-dialog" },
  { route: "/pickups", guard: "client", button: "Request Pickup", slug: "customer-pickups__request-pickup-dialog" },
];

function slugFor(route) {
  return route === "/" ? "root" : route.replace(/^\//, "").replace(/\//g, "-");
}

async function sweepRoute(context, route, guard, results) {
  const page = await context.newPage();
  const entry = {
    route,
    guard,
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
    screenshot: null,
    finalUrl: null,
    ok: true,
  };

  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error") entry.consoleErrors.push(msg.text());
    else if (type === "warning") entry.consoleWarnings.push(msg.text());
  });
  page.on("pageerror", (err) => {
    entry.pageErrors.push(String(err?.stack || err));
  });
  page.on("requestfailed", (req) => {
    entry.failedRequests.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText ?? "unknown",
    });
  });

  try {
    // NOTE: "networkidle" never fires in Next dev mode — Turbopack HMR keeps
    // a persistent WebSocket open — so wait for "load" and then give
    // client-side fetches/toasts a fixed settle window instead.
    await page.goto(`${BASE_URL}${route}`, {
      waitUntil: "load",
      timeout: 15000,
    });
  } catch (e) {
    entry.ok = false;
    entry.navError = String(e);
  }

  // Give TanStack Query's retry (1 retry, ~1s backoff) time to fully settle
  // into its final error/success state before screenshotting — a shorter
  // wait here just captures the loading skeleton mid-flight, which looks
  // like a bug but isn't.
  await page.waitForTimeout(4000);

  entry.finalUrl = page.url();

  const slug = slugFor(route);
  const screenshotPath = path.join(OUT_DIR, `${slug}.png`);
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    entry.screenshot = path.relative(process.cwd(), screenshotPath);
  } catch (e) {
    entry.screenshotError = String(e);
  }

  results.push(entry);
  await page.close();
  return entry;
}

async function sweepDialog(context, check, results) {
  const page = await context.newPage();
  const entry = {
    route: `${check.route} (dialog: ${check.button})`,
    guard: check.guard,
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedRequests: [],
    screenshot: null,
    ok: true,
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") entry.consoleErrors.push(msg.text());
    else if (msg.type() === "warning") entry.consoleWarnings.push(msg.text());
  });
  page.on("pageerror", (err) => entry.pageErrors.push(String(err?.stack || err)));
  page.on("requestfailed", (req) =>
    entry.failedRequests.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText ?? "unknown",
    })
  );

  try {
    await page.goto(`${BASE_URL}${check.route}`, {
      waitUntil: "load",
      timeout: 15000,
    });
    await page.waitForTimeout(3000);
    const btn = page.getByRole("button", { name: check.button, exact: false }).first();
    await btn.waitFor({ state: "visible", timeout: 10000 });
    await btn.click({ timeout: 10000 });
    await page.waitForTimeout(1000);
  } catch (e) {
    entry.ok = false;
    entry.navError = String(e);
  }

  const screenshotPath = path.join(OUT_DIR, `${check.slug}.png`);
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    entry.screenshot = path.relative(process.cwd(), screenshotPath);
  } catch (e) {
    entry.screenshotError = String(e);
  }

  results.push(entry);
  await page.close();
}

/**
 * A single hung route must never hang the whole sweep. Race the real work
 * against a hard external timer; if the timer wins, record a timeout entry
 * and move on. `label` identifies the check in the timeout message.
 */
function withWatchdog(promiseFactory, ms, label) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ timedOut: true, label });
    }, ms);
    promiseFactory().then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ timedOut: false, value });
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ timedOut: false, error: err });
      }
    );
  });
}

async function main() {
  const browser = await chromium.launch();
  const staffContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const clientContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await seedAuth(staffContext, STAFF_SESSION);
  await seedAuth(clientContext, CLIENT_SESSION);

  const contextFor = (guard) =>
    guard === "staff" ? staffContext : guard === "client" ? clientContext : publicContext;

  const results = [];

  for (const [route, guard] of ROUTES) {
    process.stdout.write(`sweeping ${route} (${guard ?? "public"})... `);
    const outcome = await withWatchdog(
      () => sweepRoute(contextFor(guard), route, guard, results),
      25000,
      route
    );
    if (outcome.timedOut) {
      results.push({ route, guard, watchdogTimeout: true, ok: false });
      console.log("WATCHDOG TIMEOUT (25s) — moving on");
      continue;
    }
    const entry = outcome.value;
    console.log(
      entry.ok
        ? `ok (${entry.consoleErrors.length} console errors, ${entry.pageErrors.length} page errors, ${entry.failedRequests.length} failed requests)`
        : `NAV FAILED: ${entry.navError}`
    );
  }

  for (const check of DIALOG_CHECKS) {
    process.stdout.write(`sweeping dialog ${check.slug}... `);
    const outcome = await withWatchdog(
      () => sweepDialog(contextFor(check.guard), check, results),
      25000,
      check.slug
    );
    if (outcome.timedOut) {
      results.push({ route: `${check.route} (dialog: ${check.button})`, guard: check.guard, watchdogTimeout: true, ok: false });
      console.log("WATCHDOG TIMEOUT (25s) — moving on");
      continue;
    }
    const entry = results[results.length - 1];
    console.log(
      entry.ok
        ? `ok (${entry.consoleErrors.length} console errors, ${entry.pageErrors.length} page errors)`
        : `FAILED: ${entry.navError}`
    );
  }

  await browser.close().catch(() => {});

  writeFileSync(
    path.join(OUT_DIR, "summary.json"),
    JSON.stringify(results, null, 2)
  );

  // Print a compact report of anything worth looking at.
  console.log("\n=== ISSUES FOUND ===");
  let issueCount = 0;
  for (const r of results) {
    const realIssues = [
      ...(r.consoleErrors ?? []).map((m) => `console.error: ${m}`),
      ...(r.pageErrors ?? []).map((m) => `pageerror: ${m}`),
    ];
    if (!r.ok || realIssues.length > 0) {
      issueCount++;
      console.log(`\n-- ${r.route} --`);
      if (r.watchdogTimeout) console.log(`  WATCHDOG TIMEOUT (25s)`);
      else if (!r.ok) console.log(`  NAV: ${r.navError}`);
      for (const issue of realIssues) console.log(`  ${issue}`);
    }
  }
  if (issueCount === 0) console.log("(none — no console.error/pageerror across any route)");

  console.log(`\nScreenshots + summary.json written to ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
