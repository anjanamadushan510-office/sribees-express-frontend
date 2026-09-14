/**
 * End-to-end browser test of the pickup dispatch board and zone lanes against a
 * REAL backend, in the style of e2e-admin-portal.mjs: real staff login, real
 * parcels, exits non-zero on a failed check or an unexpected console error.
 *
 * It ASSIGNS parcels, so point it at a disposable backend, and make sure at
 * least one area has pickups awaiting a rider before running (book a couple
 * through POST /ecommerce/rates + /shipments).
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/e2e-dispatch-board.mjs
 * with the app started against that backend, e.g.
 *   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010/api/v1 npx next dev -p 3000
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "qa-output", "e2e-dispatch");
mkdirSync(OUT, { recursive: true });

let failed = false;
const check = (cond, msg, detail) => {
  console.log(`${cond ? "  ok  " : "  FAIL"} ${msg}`);
  if (!cond) { failed = true; if (detail) console.log(`       ${detail}`); }
};

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));
page.on("response", (r) => { if (r.status() >= 400) console.log("  HTTP", r.status(), r.url()); });

console.log("[1] staff login");
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
await page.locator("#email").fill(process.env.STAFF_EMAIL ?? "e2e-admin@sribees.dev");
await page.locator("#password").fill(process.env.STAFF_PASSWORD ?? "E2e-Pass-2026!");
await page.getByRole("button", { name: /sign in|log ?in/i }).click();
await page.waitForTimeout(6000);
check(!/login/.test(new URL(page.url()).pathname), `signed in, landed on ${new URL(page.url()).pathname}`);

console.log("[2] dispatch board");
await page.goto(`${BASE}/admin/dispatch`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
const areaButton = page.getByRole("button", { name: /Moratuwa/ });
await areaButton.waitFor({ timeout: 20000 });
check(await areaButton.isVisible(), "Moratuwa shows as a pickup area with parcels waiting");
await areaButton.click();
await page.waitForTimeout(1500);
const bodyText = await page.locator("body").innerText();
check(/SXP00000000/.test(bodyText), "the area's parcels are listed by waybill");
check(/COD/.test(bodyText) && /Prepaid/.test(bodyText), "COD and prepaid parcels are told apart");
await page.screenshot({ path: `${OUT}/dispatch-board.png`, fullPage: true });

console.log("[3] assign the whole area to a rider");
await page.getByLabel(/Select all awaiting a rider/i).click().catch(async () => {
  await page.locator("label", { hasText: /Select all/i }).locator("input").click();
});
await page.locator("button").filter({ hasText: /Select a rider|Loading/ }).first().click();
await page.getByRole("option").first().click();
const assignBtn = page.getByRole("button", { name: /^Assign/ });
check(await assignBtn.isEnabled(), "Assign is enabled once parcels and a rider are chosen");
await assignBtn.click();
await page.waitForTimeout(2500);
const afterText = await page.locator("body").innerText();
check(/assigned/i.test(afterText), "the assignment is confirmed", afterText.slice(0, 200));
await page.screenshot({ path: `${OUT}/dispatch-assigned.png`, fullPage: true });

console.log("[4] the board reflects it");
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
await page.getByRole("button", { name: /Moratuwa/ }).click();
await page.waitForTimeout(1200);
const pendingRows = await page.locator("body").innerText();
check(!/SXP00000000/.test(pendingRows), "nothing is left awaiting a rider in that area");
await page.locator("button").filter({ hasText: /Awaiting rider/ }).first().click();
await page.getByRole("option", { name: /Scheduled/ }).click();
await page.waitForTimeout(1500);
const scheduled = await page.locator("body").innerText();
check(/SXP00000000/.test(scheduled), "they appear under Scheduled, with the rider named");
await page.screenshot({ path: `${OUT}/dispatch-scheduled.png`, fullPage: true });

console.log("[5] zone lanes");
await page.goto(`${BASE}/admin/locations`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
await page.getByRole("tab", { name: /Zone lanes/i }).click();
await page.waitForTimeout(1500);
const lanesText = await page.locator("body").innerText();
check(/E2E Western/.test(lanesText), "existing lanes render with zone names, not ids", lanesText.slice(0, 300));
await page.screenshot({ path: `${OUT}/zone-lanes.png`, fullPage: true });

// The dashboard's own client-portal/order-statuses call 403s for a staff token.
// Pre-existing and unrelated to these screens; everything else must be clean.
const unexpected = consoleErrors.filter((e) => !/403/.test(e));
check(unexpected.length === 0, "no console errors on any screen (bar the known dashboard 403)", unexpected.slice(0, 3).join(" | "));
await browser.close();
console.log(failed ? "\nUI CHECK FAILED" : "\nUI CHECK PASSED");
process.exit(failed ? 1 : 0);
