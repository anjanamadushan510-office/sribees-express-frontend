// Throwaway QA script for Session 5's new pages — real login against the live
// backend (WSL artisan serve + qa-demo accounts), not forged sessions.
// Run: node scripts/qa-session5.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "scripts", "qa-output", "session5");
fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];

async function checkPage(page, url, label, { waitMs = 3000 } = {}) {
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const onError = (err) => pageErrors.push(err.message);
  page.on("console", onConsole);
  page.on("pageerror", onError);

  let status = "ok";
  try {
    await page.goto(BASE + url, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(waitMs);
    const shot = path.join(OUT_DIR, `${label}.png`);
    await page.screenshot({ path: shot, fullPage: true });
  } catch (e) {
    status = "error";
    pageErrors.push(String(e));
  }

  page.off("console", onConsole);
  page.off("pageerror", onError);

  const filteredConsole = consoleErrors.filter(
    (e) => !e.includes("ERR_CONNECTION_REFUSED") && !e.includes("Failed to load resource")
  );

  results.push({ label, url, status, consoleErrors: filteredConsole, pageErrors });
  console.log(
    `[${status}] ${label} (${url}) — console:${filteredConsole.length} pageErrors:${pageErrors.length}`
  );
}

async function loginStaff(page) {
  await page.goto(BASE + "/admin/login", { waitUntil: "load" });
  await page.fill('input[name="email"], input[type="email"]', "qa-demo@sribeesexpress.local");
  await page.fill('input[name="password"], input[type="password"]', "Demo@12345");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20000 }).catch(() => {});
}

async function loginClient(page) {
  await page.goto(BASE + "/login", { waitUntil: "load" });
  await page.fill('input[name="email"], input[type="email"]', "qa-demo-client@sribeesexpress.local");
  await page.fill('input[name="password"], input[type="password"]', "Demo@12345");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => {});
}

const browser = await chromium.launch();

// --- Staff session ---
{
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginStaff(page);
  await checkPage(page, "/admin/dashboard", "staff-00-dashboard-sanity");

  await checkPage(page, "/admin/branch-finances", "staff-01-branch-finances-deposits");
  await page.click('button[role="tab"]:has-text("Expense Approvals")').catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, "staff-02-branch-finances-expenses.png"), fullPage: true }).catch(() => {});

  await checkPage(page, "/admin/clients/users", "staff-03-client-users");
  await checkPage(page, "/admin/clients/profile-requests", "staff-04-profile-requests");
  await checkPage(page, "/admin/clients/announcements", "staff-05-announcements");

  await checkPage(page, "/admin/sorting", "staff-06-sorting-city");
  for (const [tab, name] of [
    ["Buckets", "staff-07-sorting-buckets"],
    ["Hold Orders", "staff-08-sorting-hold"],
    ["Device Settings", "staff-09-sorting-devices"],
    ["Bags", "staff-10-sorting-bags"],
  ]) {
    await page.click(`button[role="tab"]:has-text("${tab}")`).catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true }).catch(() => {});
  }

  await checkPage(page, "/admin/reports", "staff-11-reports-async");
  await page.click('button[role="tab"]:has-text("Bespoke Reports")').catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT_DIR, "staff-12-reports-bespoke.png"), fullPage: true }).catch(() => {});

  await checkPage(page, "/admin/packages/new", "staff-13-packages-new-manual-waybill");
  await page.click('button:has-text("Enter waybill manually")').catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, "staff-14-packages-new-manual-toggled.png"), fullPage: true }).catch(() => {});

  await context.close();
}

// --- Client session ---
{
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginClient(page);
  await checkPage(page, "/dashboard", "client-00-dashboard-sanity");

  await checkPage(page, "/finances", "client-01-finances-invoices");
  await checkPage(page, "/waybill-requests", "client-02-waybill-requests");

  await checkPage(page, "/shipments", "client-03-shipments");
  await page.click('button:has-text("Webhook settings")').catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, "client-04-webhook-dialog.png"), fullPage: true }).catch(() => {});

  await context.close();
}

await browser.close();

fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(results, null, 2));

const crashed = results.filter((r) => r.status === "error" || r.pageErrors.length > 0);
console.log(`\n${results.length} checks, ${crashed.length} with errors.`);
if (crashed.length) {
  console.log(JSON.stringify(crashed, null, 2));
}
