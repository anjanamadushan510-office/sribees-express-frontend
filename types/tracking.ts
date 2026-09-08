/**
 * Presentation shape for the shared <TrackingTimeline>.
 *
 * Deliberately not the API's `OrderHistoryEntry`: the timeline is also fed by
 * the admin package view, and keeping one small view model between them means
 * a change to the API's history payload touches the mappers, not the
 * component.
 */
export interface TrackingStatusEntry {
  name: string;
  remarks?: string | null;
  added_date: string;
}

export type { ClientOrder as TrackedOrder, OrderHistoryEntry } from "@/types/order";
