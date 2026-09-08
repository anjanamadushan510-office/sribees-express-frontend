import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  listBranchManifest,
  listDDManifest,
  listReturnClientManifest,
  listReturnHOManifest,
  listRiderManifest,
} from "@/lib/api/admin-manifests";
import type {
  BranchManifestListParams,
  ReturnHOManifestListParams,
  RiderManifestListParams,
} from "@/types/admin-manifest";

export function useBranchManifest(params: BranchManifestListParams) {
  return useQuery({
    queryKey: ["admin-branch-manifest", params],
    queryFn: () => listBranchManifest(params),
    placeholderData: keepPreviousData,
  });
}

export function useRiderManifest(params: RiderManifestListParams) {
  return useQuery({
    queryKey: ["admin-rider-manifest", params],
    queryFn: () => listRiderManifest(params),
    placeholderData: keepPreviousData,
  });
}

export function useReturnHOManifest(params: ReturnHOManifestListParams) {
  return useQuery({
    queryKey: ["admin-return-ho-manifest", params],
    queryFn: () => listReturnHOManifest(params),
    placeholderData: keepPreviousData,
  });
}

export function useDDManifest(params: ReturnHOManifestListParams) {
  return useQuery({
    queryKey: ["admin-dd-manifest", params],
    queryFn: () => listDDManifest(params),
    placeholderData: keepPreviousData,
  });
}

export function useReturnClientManifest(params: ReturnHOManifestListParams) {
  return useQuery({
    queryKey: ["admin-return-client-manifest", params],
    queryFn: () => listReturnClientManifest(params),
    placeholderData: keepPreviousData,
  });
}
