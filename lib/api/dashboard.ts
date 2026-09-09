import { get } from "@/lib/api/client";
import type { DashboardSummary, StatusCount } from "@/types/dashboard";
import type { OrderStatus } from "@/types/order";

/**
 * Which pipeline milestones get a card, in display order.
 *
 * This is a product decision — the catalogue has 15 statuses and a merchant
 * does not want 15 tiles — so the list is curated. But only the *selection* is
 * hard-coded: the label and the count both come from the API, so renaming a
 * status renames the card, and `orderedStatusCounts` reports any key that has
 * drifted out of the catalogue instead of quietly rendering a zero forever.
 */
export const DASHBOARD_STATUS_KEYS = [
  "pending",
  "picked_up",
  "collected_at_sorting_center",
  "dispatched_to_destination",
  "out_for_delivery",
  "delivered",
] as const;

/** GET /client-portal/dashboard/summary */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  return get<DashboardSummary>("/client-portal/dashboard/summary");
}

/** GET /client-portal/order-statuses — the catalogue, in pipeline order. */
export async function getOrderStatusCatalogue(): Promise<OrderStatus[]> {
  return get<OrderStatus[]>("/client-portal/order-statuses");
}

/**
 * Counts for the milestone cards: catalogue names, summary counts, fixed order.
 *
 * A status the summary does not mention means zero orders in it, not "no such
 * status" — the endpoint only reports statuses that have orders — so a missing
 * entry renders 0 rather than vanishing.
 *
 * A key missing from the *catalogue* is different: it means this list has
 * drifted from the backend. That is a bug, not a zero, so the card is dropped
 * and the mismatch is logged. Rendering it as "0 Processing" forever is how a
 * dashboard quietly lies for a year.
 */
export function orderedStatusCounts(
  summary: DashboardSummary,
  catalogue: OrderStatus[]
): StatusCount[] {
  const counts = new Map(summary.by_status.map((s) => [s.status_key, s.count]));
  const known = new Map(catalogue.map((s) => [s.key, s]));

  const missing = DASHBOARD_STATUS_KEYS.filter((key) => !known.has(key));
  if (missing.length > 0) {
    console.warn(
      `[dashboard] status key(s) not in the backend catalogue: ${missing.join(", ")}. ` +
        `Update DASHBOARD_STATUS_KEYS in lib/api/dashboard.ts.`
    );
  }

  return DASHBOARD_STATUS_KEYS.filter((key) => known.has(key)).map((key) => ({
    status_key: key,
    status_name: known.get(key)!.name,
    count: counts.get(key) ?? 0,
  }));
}
