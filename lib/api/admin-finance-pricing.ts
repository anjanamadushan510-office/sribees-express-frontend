import { api, get } from "@/lib/api/client";
import type {
  ClientZoneLaneRate,
  ClientZoneLaneRateCreate,
  ClientZoneLaneRateUpdate,
  ClientZoneRate,
  ClientZoneRateCreate,
  ClientZoneRateUpdate,
} from "@/types/admin-finance-pricing";

/** GET /finance/clients/{id}/zone-rates */
export const listClientZoneRates = (clientId: number) =>
  get<ClientZoneRate[]>(`/finance/clients/${clientId}/zone-rates`);

/** POST /finance/clients/{id}/zone-rates — create, or replace the existing rate for that zone. */
export async function upsertClientZoneRate(
  clientId: number,
  payload: ClientZoneRateCreate
): Promise<ClientZoneRate> {
  const { data } = await api.post<ClientZoneRate>(
    `/finance/clients/${clientId}/zone-rates`,
    payload
  );
  return data;
}

/** PATCH /finance/zone-rates/{id} */
export async function updateClientZoneRate(
  rateId: number,
  payload: ClientZoneRateUpdate
): Promise<ClientZoneRate> {
  const { data } = await api.patch<ClientZoneRate>(`/finance/zone-rates/${rateId}`, payload);
  return data;
}

/** GET /finance/clients/{id}/zone-lane-rates */
export const listClientZoneLaneRates = (clientId: number) =>
  get<ClientZoneLaneRate[]>(`/finance/clients/${clientId}/zone-lane-rates`);

/** POST /finance/clients/{id}/zone-lane-rates — create, or replace the existing rate for that corridor. */
export async function upsertClientZoneLaneRate(
  clientId: number,
  payload: ClientZoneLaneRateCreate
): Promise<ClientZoneLaneRate> {
  const { data } = await api.post<ClientZoneLaneRate>(
    `/finance/clients/${clientId}/zone-lane-rates`,
    payload
  );
  return data;
}

/** PATCH /finance/zone-lane-rates/{id} */
export async function updateClientZoneLaneRate(
  rateId: number,
  payload: ClientZoneLaneRateUpdate
): Promise<ClientZoneLaneRate> {
  const { data } = await api.patch<ClientZoneLaneRate>(
    `/finance/zone-lane-rates/${rateId}`,
    payload
  );
  return data;
}
