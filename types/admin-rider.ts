/** `RiderOut` — a Staff row carrying the rider role. */
export interface Rider {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  /** Branches this rider is attached to. */
  branch_ids: number[];
}

/** GET /fleet/riders/{id}/location — the rider's most recent ping. */
export interface RiderLocation {
  rider_id: number;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

/** GET/POST /fleet/riders/{id}/branches. */
export interface RiderBranches {
  rider_id: number;
  branch_ids: number[];
}

/** Additive; `detach: true` removes the selection instead. */
export interface RiderBranchAssign {
  rider_id: number;
  branch_ids: number[];
  detach?: boolean;
}
