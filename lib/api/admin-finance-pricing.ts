import { api, get } from "@/lib/api/client";
import type {
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
