/** A row from GET /v1/mile-operations/list (MileOperationListAction — mirrors AdminOrderRow). */
export interface MileOperationRow {
  id: number;
  order_no: string | null;
  order_date: string;
  waybill_id: string;
  client_name: string | null;
  customer_name: string;
  delivery_address: string;
  phone_no: string;
  cod: number | string;
  delivery_charge: number | string;
  district: string | null;
  city: string | null;
  rider: string | null;
  remarks: string | null;
  status: string | null;
  client_pickup_branch: string | null;
}

export interface MileOperationListParams {
  page?: number;
  perPage?: number;
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
  /** Required by the backend — at least one PrimaryStatusType key. */
  statuses: string[];
  is_pickup?: boolean;
  client_id?: number;
  branch_id?: number;
}

/** Payload for PUT /v1/mile-operations/update (MileOperationUpdateStatusDTO / …AssignedRiderDTO). */
export interface UpdateMileOperationStatusPayload {
  waybill_id: string;
  status_key: string;
  rider_id?: number;
}

/** The 10 PrimaryStatusType keys this module's pickup/return mile-operations workflow covers. */
export const MILE_OPERATION_STATUSES: { key: string; label: string; assignsRider: boolean }[] = [
  { key: "key_30", label: "Received at Pickup Branch", assignsRider: false },
  { key: "key_31", label: "Assigned to Pickup Rider", assignsRider: true },
  { key: "key_32", label: "Picked up From Merchant", assignsRider: false },
  { key: "key_33", label: "Received At Shuttle (Dispatch to HO)", assignsRider: false },
  { key: "key_34", label: "Dispatch to Pickup Branch (Return Order)", assignsRider: false },
  { key: "key_35", label: "Returned to Merchant", assignsRider: false },
  { key: "key_36", label: "Reschedule (Return Order)", assignsRider: false },
  { key: "key_37", label: "Received at Pickup Branch (Return Order)", assignsRider: false },
  { key: "key_38", label: "Assign to Return Rider", assignsRider: true },
  { key: "key_39", label: "Return to Pickup Branch (Return Order)", assignsRider: false },
];
