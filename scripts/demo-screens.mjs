import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "scripts/qa-output/demo";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(page, path, file, waitMs = 6000) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: true });
  console.log(`shot: ${path} -> ${file}`);
}

// --- Staff/admin session ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/admin/login", { waitUntil: "load" });
  await page.getByLabel(/email/i).fill("qa-demo@sribeesexpress.local");
  await page.getByRole("textbox", { name: /password/i }).fill("Demo@12345");
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 }).catch(() => {});
  await shoot(page, "/admin/dashboard", "01-admin-dashboard.png", 8000);
  await shoot(page, "/admin/packages", "02-admin-packages.png", 6000);
  await shoot(page, "/admin/clients", "03-admin-clients.png", 6000);
  await shoot(page, "/admin/branches", "04-admin-branches.png", 6000);
  await ctx.close();
}

// --- Customer session ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/login", { waitUntil: "load" });
  await page.getByLabel(/email/i).fill("qa-demo-client@sribeesexpress.local");
  await page.getByRole("textbox", { name: /password/i }).fill("Demo@12345");
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 }).catch(() => {});
  await shoot(page, "/dashboard", "05-customer-dashboard.png", 6000);
  await shoot(page, "/shipments", "06-customer-shipments.png", 6000);
  await ctx.close();
}

// --- Public ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await shoot(page, "/", "07-public-landing.png", 1500);
  await ctx.close();
}

await browser.close();
console.log("DONE");
