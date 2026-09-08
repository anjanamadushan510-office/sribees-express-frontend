import { api, pickKey, unwrap } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  ClientProfile,
  UpdateAccountPayload,
  UpdatePasswordPayload,
} from "@/types/profile";

/** GET /api/v1/my-profile/client → { my_profile }. */
export async function getMyProfile(): Promise<ClientProfile> {
  const res = await api.get<ApiResponse<unknown>>("/v1/my-profile/client");
  const profile = pickKey<ClientProfile>(unwrap(res), "my_profile");
  if (!profile) throw new Error("Profile not found");
  return profile;
}

/** PUT /api/v1/my-profile/update-account. */
export async function updateAccount(payload: UpdateAccountPayload): Promise<void> {
  await api.put("/v1/my-profile/update-account", payload);
}

/** PUT /api/v1/my-profile/update-password. */
export async function updatePassword(payload: UpdatePasswordPayload): Promise<void> {
  await api.put("/v1/my-profile/update-password", payload);
}
