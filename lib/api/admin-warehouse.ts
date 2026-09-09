import { api, get } from "@/lib/api/client";
import type {
  Bag,
  BagCreate,
  SortingBucket,
  SortingBucketCreate,
} from "@/types/admin-warehouse";

// --- Bags --------------------------------------------------------------------
export const listBags = () => get<Bag[]>("/warehouse/bags");
export const getBag = (bagId: number | string) => get<Bag>(`/warehouse/bags/${bagId}`);

export async function createBag(payload: BagCreate): Promise<Bag> {
  const { data } = await api.post<Bag>("/warehouse/bags", payload);
  return data;
}

/** Add one order to an open bag. The response is the whole bag, so the caller
 *  never has to guess what the contents became. */
export async function addOrderToBag(
  bagId: number | string,
  orderId: number
): Promise<Bag> {
  const { data } = await api.post<Bag>(`/warehouse/bags/${bagId}/orders`, {
    order_id: orderId,
  });
  return data;
}

/** Seal a bag. Irreversible — there is no reopen endpoint, by design. */
export async function closeBag(bagId: number | string): Promise<Bag> {
  const { data } = await api.post<Bag>(`/warehouse/bags/${bagId}/close`, {});
  return data;
}

// --- Sorting buckets ---------------------------------------------------------
export const listSortingBuckets = () =>
  get<SortingBucket[]>("/warehouse/sorting-buckets");

export async function createSortingBucket(
  payload: SortingBucketCreate
): Promise<SortingBucket> {
  const { data } = await api.post<SortingBucket>(
    "/warehouse/sorting-buckets",
    payload
  );
  return data;
}
