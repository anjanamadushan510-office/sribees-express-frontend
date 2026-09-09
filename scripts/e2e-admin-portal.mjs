/**
 * End-to-end smoke test of the ported admin screens against a REAL backend.
 *
 * Companion to e2e-customer-portal.mjs, same rules: real staff login, real
 * data, exits non-zero on any failed check or console error.
 *
 * Only the screens backed by a real endpoint are asserted. The unported ones
 * (clients, manifests, roles, staff, waybills …) are visited too, but merely
 * to confirm they fail *visibly* rather than rendering a plausible-looking
 * empty state — see docs/API-GAPS.md.
 *
 * Usage:
 *   STAFF_EMAIL=... STAFF_PASSWORD=... BASE_URL=http://localhost:3100 \
 *     node scripts/e2e-admin-portal.mjs
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "qa-output", "e2e-admin");
mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";
const EMAIL = process.env.STAFF_EMAIL;
const PASSWORD = process.env.STAFF_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("STAFF_EMAIL and STAFF_PASSWORD are required");
  process.exit(2);
}

const results = [];
const consoleErrors = [];

function record(step, ok, detail = "") {
  results.push({ step, ok, detail });
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${step}${detail ? ` — ${detail}` : ""}`);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
}

async function settle(p, ms = 2500) {
  await p.waitForLoadState("load").catch(() => {});
  await p.waitForTimeout(ms);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const text = msg.text();
  if (/Download the React DevTools/i.test(text)) return;
  // Expected: unported screens deliberately throw FeatureUnavailableError, and
  // react-query logs the rejection. That is the designed behaviour, not a bug.
  if (/is not available yet|FeatureUnavailableError/i.test(text)) return;
  // A 403 on the staff-token catalogue read is a known and documented gap.
  if (/403/.test(text)) return;
  consoleErrors.push({ url: page.url(), text });
});
page.on("pageerror", (err) => {
  if (/is not available yet|FeatureUnavailableError/i.test(err.message)) return;
  consoleErrors.push({ url: page.url(), text: `uncaught: ${err.message}` });
});

try {
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 60_000 });
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"], input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20_000 });
  await settle(page);
  record("staff login", true, page.url());
  await shot(page, "01-after-login");

  const session = await page
    .evaluate(() => localStorage.getItem("sx_session"))
    .then((raw) => (raw ? JSON.parse(raw) : null));
  record(
    "staff session persisted with guard=staff",
    session?.guard === "staff" && Boolean(session?.accessToken),
    session ? `user=${session.user?.email}` : "no session"
  );

  // --- dashboard -------------------------------------------------------------
  await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "02-dashboard");
  const dashText = await page.locator("body").innerText();
  record("dashboard shows a total-orders figure", /Total orders/i.test(dashText));
  record(
    "dashboard renders without placeholder junk",
    !/undefined|\[object Object\]|NaN/.test(dashText)
  );

  // --- packages (orders) -----------------------------------------------------
  await page.goto(`${BASE_URL}/admin/packages`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "03-packages");
  const orderRows = await page.locator("tbody tr").count();
  record("packages list renders rows", orderRows > 0, `${orderRows} row(s)`);

  if (orderRows > 0) {
    await page.locator("tbody tr").first().click();
    await page.waitForURL(/\/admin\/packages\/\d+/, { timeout: 20_000 });
    await settle(page);
    await shot(page, "04-package-detail");
    const detail = await page.locator("body").innerText();
    record("order detail shows recipient and status history", /Recipient/i.test(detail) && /Status history/i.test(detail));
    record("order detail has an assign-rider action", /Assign rider/i.test(detail));
    record(
      "order detail renders no placeholder junk",
      !/undefined|\[object Object\]|NaN/.test(detail)
    );
  }

  // --- drivers ---------------------------------------------------------------
  await page.goto(`${BASE_URL}/admin/drivers`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "05-drivers");
  const driverText = await page.locator("body").innerText();
  record("drivers page loads", /Drivers/i.test(driverText));

  // --- pickups ---------------------------------------------------------------
  await page.goto(`${BASE_URL}/admin/pickups`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "06-pickups");
  const pickupRows = await page.locator("tbody tr").count();
  record("pickup requests render", pickupRows > 0, `${pickupRows} row(s)`);

  // --- notification settings -------------------------------------------------
  await page.goto(`${BASE_URL}/admin/settings/notifications`, {
    waitUntil: "domcontentloaded",
  });
  await settle(page);
  await shot(page, "07-notifications");
  const notifRows = await page.locator("tbody tr").count();
  record("notification settings render", notifRows > 0, `${notifRows} row(s)`);

  // --- unported screens must fail visibly ------------------------------------
  for (const route of ["/admin/clients", "/admin/manifests", "/admin/roles"]) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
    await settle(page, 2000);
    const text = await page.locator("body").innerText();
    // "0 rows" with no explanation is the failure mode this guards against: a
    // screen that looks like real, empty data when it never asked the server.
    const looksEmptyButFine =
      /No .* found|no results/i.test(text) && !/couldn|error|not available/i.test(text);
    record(`${route} does not fake an empty state`, !looksEmptyButFine);
  }
  await shot(page, "08-unported-screen");
} catch (error) {
  record("run completed without throwing", false, String(error).slice(0, 300));
  await shot(page, "99-failure");
} finally {
  await browser.close();
}

console.log("\nConsole errors:");
if (consoleErrors.length === 0) console.log("  none");
else for (const e of consoleErrors) console.log(`  ${e.url}\n    ${e.text}`);

writeFileSync(
  path.join(OUT_DIR, "summary.json"),
  JSON.stringify({ results, consoleErrors }, null, 2)
);

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed, ` +
    `${consoleErrors.length} console error(s)`
);
process.exit(failed.length > 0 || consoleErrors.length > 0 ? 1 : 0);
