/** A single status entry in a tracked order's history. */
export interface TrackingStatusEntry {
  name: string;
  remarks: string | null;
  added_date: string;
}

/**
 * Public tracking result (OrderAPIResource).
 * NOTE: the backend emits a key literally named "completed date" (with a space).
 */
export interface TrackingResult {
  waybill_id: string;
  order_no: string | null;
  customer_name: string;
  customer_address: string;
  customer_district: string;
  customer_city: string;
  customer_phone_no: string;
  weight: number | string | null;
  placed_date: string;
  "completed date": string | null;
  current_status: string;
  status_history: TrackingStatusEntry[];
}
