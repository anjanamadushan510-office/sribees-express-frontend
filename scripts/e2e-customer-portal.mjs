/**
 * End-to-end smoke test of the customer portal against a REAL backend.
 *
 * Unlike scripts/qa-sweep.mjs, this forges nothing: it signs in through the
 * actual login form with real credentials and drives the real screens, so it
 * exercises the token flow, the API contract and the rendering together. That
 * combination is what catches the bugs contract-checking alone misses — a
 * status key that exists but is not the one the UI hard-coded, for instance.
 *
 * Usage:
 *   CLIENT_EMAIL=... CLIENT_PASSWORD=... BASE_URL=http://localhost:3100 \
 *     node scripts/e2e-customer-portal.mjs
 *
 * Exits non-zero if any step fails or any page logs a console error, so it is
 * usable as a gate rather than something a human has to read.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "qa-output", "e2e");
mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";
const EMAIL = process.env.CLIENT_EMAIL;
const PASSWORD = process.env.CLIENT_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("CLIENT_EMAIL and CLIENT_PASSWORD are required");
  process.exit(2);
}

const results = [];
const consoleErrors = [];

function record(step, ok, detail = "") {
  results.push({ step, ok, detail });
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${step}${detail ? ` — ${detail}` : ""}`);
}

/** Screenshot every step: a failure you can see beats a failure you can't. */
async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
}

/** Wait for the app shell to have rendered something, not just for a document. */
async function settle(p, ms = 2500) {
  await p.waitForLoadState("load").catch(() => {});
  await p.waitForTimeout(ms);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") {
    const text = msg.text();
    // React's hydration/devtools noise is not what this test is looking for.
    if (/Download the React DevTools/i.test(text)) return;
    consoleErrors.push({ url: page.url(), text });
  }
});
page.on("pageerror", (err) => {
  consoleErrors.push({ url: page.url(), text: `uncaught: ${err.message}` });
});

try {
  // --- login -----------------------------------------------------------------
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  // The submit button is disabled until React hydrates, so waiting for it to
  // become enabled is a precise hydration signal — far better than sleeping
  // and hoping. Without it the click fires a native, unhandled form submit.
  await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 60_000 });
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"], input[name="password"]', PASSWORD);
  await shot(page, "01-login-filled");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("login"), { timeout: 20_000 });
  record("login redirects away from /login", true, page.url());
  await shot(page, "02-after-login");

  // The session must actually be persisted, not just the redirect fired.
  const stored = await page.evaluate(() => localStorage.getItem("sx_session"));
  const session = stored ? JSON.parse(stored) : null;
  record(
    "session persisted with both tokens",
    Boolean(session?.accessToken && session?.refreshToken),
    session ? `guard=${session.guard} user=${session.user?.email}` : "no session in localStorage"
  );

  // --- dashboard -------------------------------------------------------------
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "03-dashboard");
  const cardLabels = await page
    .locator("p.uppercase")
    .allTextContents()
    .then((t) => t.map((s) => s.trim()).filter(Boolean));
  // The labels come from the API catalogue, so a hard-coded key that has
  // drifted shows up here as a missing card rather than a wrong number.
  record(
    "dashboard renders status cards from the catalogue",
    cardLabels.length > 0,
    cardLabels.join(" | ")
  );
  const totalText = await page.locator("p.text-4xl").first().textContent().catch(() => null);
  record("dashboard shows a total", totalText !== null, `total=${totalText?.trim()}`);

  // --- shipments list --------------------------------------------------------
  await page.goto(`${BASE_URL}/shipments`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "04-shipments");
  const rowCount = await page.locator("tbody tr").count();
  record("shipments list renders rows", rowCount > 0, `${rowCount} row(s)`);

  // --- shipment detail -------------------------------------------------------
  if (rowCount > 0) {
    await page.locator("tbody tr").first().click();
    await page.waitForURL(/\/shipments\/\d+/, { timeout: 20_000 });
    await settle(page);
    await shot(page, "05-shipment-detail");
    const body = await page.locator("body").innerText();
    record("detail shows the recipient", /Recipient/i.test(body));
    record("detail shows tracking history", /Tracking history/i.test(body));
    record(
      "detail does not render raw field names",
      !/undefined|\[object Object\]|NaN/.test(body),
      "checked for undefined / [object Object] / NaN"
    );
  }

  // --- pickups ---------------------------------------------------------------
  await page.goto(`${BASE_URL}/pickups`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "06-pickups");
  const pickupRows = await page.locator("tbody tr").count();
  record("pickups list renders", pickupRows > 0, `${pickupRows} row(s)`);

  // --- new shipment form: the city dropdown is the thing that was impossible --
  await page.goto(`${BASE_URL}/shipments/new`, { waitUntil: "domcontentloaded" });
  await settle(page);
  await shot(page, "07-new-shipment");
  const cityTrigger = page.getByRole("combobox").first();
  let cityCount = 0;
  if (await cityTrigger.count()) {
    await cityTrigger.click();
    await page.waitForTimeout(800);
    cityCount = await page.getByRole("option").count();
    await shot(page, "08-city-dropdown");
    await page.keyboard.press("Escape");
  }
  record("city dropdown is populated from the API", cityCount > 0, `${cityCount} option(s)`);

  // --- public tracking, signed out ------------------------------------------
  const waybill = process.env.TRACK_WAYBILL;
  if (waybill) {
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(`${BASE_URL}/track`, { waitUntil: "domcontentloaded" });
    await settle(anonPage);
    await anonPage.fill('input[aria-label="Waybill number"]', waybill);
    await anonPage.click('button[type="submit"]');
    await anonPage.waitForTimeout(3000);
    await anonPage.screenshot({ path: path.join(OUT_DIR, "09-public-tracking.png"), fullPage: true });
    const text = await anonPage.locator("body").innerText();
    record("public tracking finds the waybill", text.includes(waybill), waybill);
    // The point of the narrow projection: verify it in the rendered page, not
    // just in the JSON.
    const leaked = ["Nimal Perera", "0771234567", "Temple Road", "4500"].filter((s) =>
      text.includes(s)
    );
    record("public tracking page shows no PII", leaked.length === 0, leaked.join(", ") || "none");
    await anon.close();
  }
} catch (error) {
  record("run completed without throwing", false, String(error).slice(0, 300));
  await shot(page, "99-failure");
} finally {
  await browser.close();
}

console.log("\nConsole errors:");
if (consoleErrors.length === 0) {
  console.log("  none");
} else {
  for (const e of consoleErrors) console.log(`  ${e.url}\n    ${e.text}`);
}

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
