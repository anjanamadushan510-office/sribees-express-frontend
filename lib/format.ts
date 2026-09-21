/** Formatting helpers shared across the app. */
import { serverNow } from "@/lib/server-clock";

/**
 * Every timestamp on every screen is rendered in Sri Lanka time.
 *
 * The API stores and returns UTC, which is right — but rendering it in
 * *whatever timezone the viewer's machine happens to be set to* is not. A
 * browser on a server-imaged laptop, a VM, or a device with the wrong region
 * shows UTC, and a parcel delivered at 3pm then reads "09:30" on the ops
 * board. Nobody notices it is a display bug; they conclude the timestamp is
 * wrong, and every argument about when something happened starts from a
 * different clock.
 *
 * This is a Sri Lankan operation end to end, so the display timezone is a
 * constant, not a preference. Asia/Colombo is UTC+5:30 and has had no DST
 * since 2006, so this never shifts under us.
 */
const DISPLAY_TIME_ZONE = "Asia/Colombo";

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Today in Sri Lanka, as `YYYY-MM-DD`.
 *
 * For date filters and "today's" report ranges, which must mean the operating
 * day the staff are standing in — not the viewer's device day, which flips at
 * a different moment.
 */
export function todayInColombo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(serverNow());
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency = "LKR"
): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}
