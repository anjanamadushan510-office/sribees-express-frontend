import { get } from "@/lib/api/client";
import type { AdminDashboardCounts } from "@/types/admin-dashboard";
import type { OrderStatus } from "@/types/order";

/**
 * GET /analytics/dashboard/status-counts
 *
 * The staff view of the same numbers the client portal shows for one merchant:
 * counts across every order in the system, not scoped to a client.
 */
export async function getAdminDashboardCounts(): Promise<AdminDashboardCounts> {
  return get<AdminDashboardCounts>("/analytics/dashboard/status-counts");
}

/**
 * The status catalogue, for labelling and ordering the counts above.
 *
 * There is no staff-facing catalogue endpoint, so this reads the client-portal
 * one — which is client-authenticated and therefore 403s for a staff token.
 * Labels fall back to the counts' own `status_name` when it does, so the
 * dashboard degrades to unordered-but-correct rather than breaking. Tracked in
 * docs/API-GAPS.md as a staff catalogue endpoint worth adding.
 */
export async function tryGetStatusCatalogue(): Promise<OrderStatus[] | null> {
  try {
    return await get<OrderStatus[]>("/client-portal/order-statuses");
  } catch {
    return null;
  }
}
