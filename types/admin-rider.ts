/** `RiderOut` — a Staff row carrying the rider role. */
export interface Rider {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
}

/** GET /fleet/riders/{id}/location — the rider's most recent ping. */
export interface RiderLocation {
  rider_id: number;
  latitude: number;
  longitude: number;
  recorded_at: string;
}
