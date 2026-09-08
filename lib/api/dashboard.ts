import { get } from "@/lib/api/client";
import type { DashboardSummary } from "@/types/dashboard";

/**
 * Status keys the client dashboard surfaces as cards, in display order.
 *
 * The backend returns counts for every status it knows about; this list picks
 * the ones worth a card and fixes their order, so the dashboard does not
 * reshuffle itself when the catalogue grows.
 */
export const DASHBOARD_STATUS_KEYS = [
  "processing",
  "collected_from_warehouse",
  "dispatched_to_destination",
  "received_at_destination",
  "out_for_delivery",
  "delivered",
] as const;

/** GET /client-portal/dashboard/summary */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  return get<DashboardSummary>("/client-portal/dashboard/summary");
}

/**
 * Counts for the cards above, in a stable order, with a zero for any status
 * the backend did not report. Returning nothing for an absent status would
 * make an empty card silently disappear rather than show "0".
 */
export function orderedStatusCounts(summary: DashboardSummary) {
  const byKey = new Map(summary.by_status.map((s) => [s.status_key, s]));
  return DASHBOARD_STATUS_KEYS.map((key) => {
    const found = byKey.get(key);
    return {
      status_key: key,
      status_name: found?.status_name ?? humanise(key),
      count: found?.count ?? 0,
    };
  });
}

function humanise(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
