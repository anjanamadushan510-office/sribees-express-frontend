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

  // --- staff & riders --------------------------------------------------------
  await page.goto(`${BASE_URL}/admin/staff`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "08-staff");
  const staffRows = await page.locator("tbody tr").count();
  record("staff list renders rows", staffRows > 0, `${staffRows} row(s)`);
  record(
    "staff list shows the roles each person holds",
    /Super Admin|Delivery Rider/.test(await page.locator("tbody").innerText())
  );

  // --- roles & permissions ---------------------------------------------------
  await page.goto(`${BASE_URL}/admin/roles`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "09-roles");
  const rolesText = await page.locator("body").innerText();
  record("roles list renders both seeded roles", /Super Admin/.test(rolesText) && /Delivery Rider/.test(rolesText));
  record(
    "Super Admin is described as satisfying everything, not as holding 0 permissions",
    /Everything, by name/i.test(rolesText)
  );

  // --- post offices ----------------------------------------------------------
  await page.goto(`${BASE_URL}/admin/locations`, { waitUntil: "domcontentloaded" });
  await settle(page, 4000);
  await shot(page, "10-post-offices");
  const geoText = await page.locator("body").innerText();
  // The seed migration lands 2,111 rows; anything far below that means it did
  // not run, and every merchant address would resolve to post_office_not_found.
  const coverage = geoText.match(/of ([\d,]+) post\s*offices/i);
  const seeded = coverage ? Number(coverage[1].replace(/,/g, "")) : 0;
  record("post office directory is seeded", seeded >= 2000, `${seeded} in directory`);
  record(
    "coverage is broken down by district",
    /Jaffna|Kalutara|Kurunegala/.test(geoText)
  );
  const poRows = await page.locator("tbody tr").count();
  record("post office list renders a page of rows", poRows > 0, `${poRows} row(s)`);

  // --- merchants: the onboarding flow that hands out an API key --------------
  await page.goto(`${BASE_URL}/admin/clients`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "11-merchants");
  record(
    "merchants list renders",
    /Merchants/i.test(await page.locator("body").innerText())
  );

  const MERCHANT_EMAIL = "e2e-merchant@sribees.dev";
  await page.fill('input[placeholder*="Business name" i]', MERCHANT_EMAIL);
  await page.keyboard.press("Enter");
  await settle(page, 2000);
  let merchantRows = await page.locator("tbody tr").count();

  if (merchantRows === 0) {
    // First run against this database: create the merchant and its first login
    // in one form, exactly as an administrator onboarding a real one would.
    await page.click('button:has-text("New merchant")');
    await page.waitForSelector("#business_name", { timeout: 10_000 });
    await page.fill("#business_name", "E2E Test Merchant");
    await page.fill("#email", MERCHANT_EMAIL);
    await page.fill("#commission_percent", "5.00");
    await page.fill("#admin_name", "E2E Contact");
    await page.fill("#admin_email", "e2e-merchant-login@sribees.dev");
    await page.fill("#admin_password", "Test@1234");
    await page.click('button:has-text("Create merchant")');
    await page.waitForURL(/\/admin\/clients\/\d+/, { timeout: 20_000 });
    record("creating a merchant lands on its detail page", true, page.url());
  } else {
    await page.locator("tbody tr").first().click();
    await page.waitForURL(/\/admin\/clients\/\d+/, { timeout: 20_000 });
    record("opening an existing merchant works", true, page.url());
  }
  await settle(page);
  await shot(page, "12-merchant-detail");

  // Portal logins tab
  await page.click('button[role="tab"]:has-text("Portal logins")');
  await settle(page, 1500);
  await shot(page, "13-merchant-logins");
  const loginRows = await page.locator("tbody tr").count();
  record("merchant has at least one portal login", loginRows > 0, `${loginRows} login(s)`);

  // API keys tab — issue a sandbox key, check it is shown exactly once, revoke it
  await page.click('button[role="tab"]:has-text("API keys")');
  await settle(page, 1500);
  await page.click('button:has-text("Issue key")');
  await page.waitForSelector("#rate_limit", { timeout: 10_000 });
  await page.fill("#rate_limit", "300");
  // Scoped to the dialog: the card header carries a button with the same label.
  await page.locator('[role="dialog"] button:has-text("Issue key")').click();
  await page.waitForSelector("text=Key issued", { timeout: 20_000 });
  await settle(page, 1000);
  await shot(page, "14-api-key-issued");

  // Scoped to the dialog: the key table behind it shows a 16-character prefix
  // that matches the same pattern, and reading the page body would let that
  // prefix pass as "the key was shown in full".
  const revealText = await page.locator('[role="dialog"]').innerText();
  const issuedKey = revealText.match(/sk_(?:test|live)_[A-Za-z0-9_-]+/);
  record(
    "the issued key is shown in full, once",
    Boolean(issuedKey) && issuedKey[0].length > 30,
    issuedKey ? `${issuedKey[0].length} chars` : "no key on screen"
  );
  record(
    "the dialog warns that the key cannot be retrieved again",
    /only time the key is shown/i.test(revealText)
  );

  await page.click('button:has-text("I have saved it")');
  await settle(page, 1500);
  const keyTableText = await page.locator("tbody").innerText();
  record(
    "the key list shows the prefix and never the secret",
    /sk_test_/.test(keyTableText) && !(issuedKey && keyTableText.includes(issuedKey[0]))
  );
  record("the new key is listed as active", /Active/i.test(keyTableText));

  await page.locator('tbody tr:has-text("Active") button:has-text("Revoke")').first().click();
  await settle(page, 2000);
  await shot(page, "15-api-key-revoked");
  record(
    "revoking marks the key revoked rather than removing it",
    /Revoked/i.test(await page.locator("tbody").innerText())
  );

  // --- screens that still have no backend must fail visibly -----------------
  for (const route of ["/admin/manifests", "/admin/waybills"]) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
    await settle(page, 2000);
    const text = await page.locator("body").innerText();
    // "0 rows" with no explanation is the failure mode this guards against: a
    // screen that looks like real, empty data when it never asked the server.
    const looksEmptyButFine =
      /No .* found|no results/i.test(text) && !/couldn|error|not available/i.test(text);
    record(`${route} does not fake an empty state`, !looksEmptyButFine);
  }
  await shot(page, "16-unported-screen");
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
