/** A row from GET /api/v1/reasons/list (ReasonListAction). */
export interface ReasonRow {
  id: number;
  reason_type: string | null;
  reason: string;
}

/** GET /api/v1/reasons/{reason} → data[0] (Reason model + reasonType relation). */
export interface ReasonDetail {
  id: number;
  reason_type_id: number;
  reason: string;
  remarks: string | null;
  reasonType?: { id: number; name: string } | null;
}

export interface ReasonListParams {
  page?: number;
  perPage?: number;
  orderBy?: "reason_name" | "reason_type" | "id" | "created_at";
  orderByDirection?: "asc" | "desc";
  reasonType?: number;
  reason_name?: string;
}

/** Payload for POST /api/v1/reasons/create and PUT /api/v1/reasons/update/{reason}. */
export interface SaveReasonPayload {
  reason_type_id: number;
  reason: string;
  remarks?: string;
}
