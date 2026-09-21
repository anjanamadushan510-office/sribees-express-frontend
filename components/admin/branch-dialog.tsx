"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBranch, updateBranch } from "@/lib/api/admin-geo";
import { useAssignPostalCitiesToBranch, usePostalCities } from "@/lib/hooks/use-geo";
import { getErrorMessage } from "@/lib/api/client";
import type { Branch, BranchCreate, PostalCity } from "@/types/admin-geo";
import { PostalCityAssignmentEditor } from "@/components/shared/postal-city-assignment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  branch: Branch | null;
  onClose: () => void;
}

/**
 * Create/edit a branch, and (once it exists) assign the postal cities it
 * covers directly — the same search-and-add editor the Zone dialog uses,
 * wired to `POST /geo/postal-cities/assign-branch` instead of assign-zone.
 * Coverage isn't part of `BranchCreate`/`BranchUpdate` on the backend, so a
 * brand-new branch is saved first; reopen it (row click) to add cities.
 */
export function BranchDialog({ branch, onClose }: Props) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <BranchForm branch={branch} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Leaflet reaches for `window` the moment it is imported, so it cannot be in
 * the server bundle at all — `ssr: false` keeps the whole module graph on the
 * client. The placeholder holds the dialog's height so opening it does not
 * jump once the map arrives.
 */
const MapLocationPicker = dynamic(
  () => import("@/components/admin/map-location-picker").then((m) => m.MapLocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-md border bg-muted" />
    ),
  }
);

/**
 * Reads a "latitude, longitude" pair, tolerating what actually lands on the
 * clipboard: Google Maps' "6.927079, 79.861244", a space-separated pair, or
 * the parenthesised form some share sheets produce. Returns null for anything
 * it cannot read with confidence — including out-of-range values, which are
 * nearly always a swapped pair or a stray digit rather than a real place.
 */
function parseCoordinates(raw: string): { lat: number; lng: number } | null {
  const cleaned = raw.trim().replace(/[()]/g, "");
  if (cleaned === "") return null;
  const parts = cleaned.split(/[,\s]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function BranchForm({ branch, onClose }: { branch: Branch | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BranchCreate>({
    name: branch?.name ?? "",
    address: branch?.address ?? "",
    phone_no: branch?.phone_no ?? "",
  });
  const [isActive, setIsActive] = useState(branch?.is_active ?? true);
  // Kept as one string, not two number inputs: nobody types a coordinate pair
  // by hand. They copy "6.927079, 79.861244" out of Google Maps and paste it,
  // so the field that accepts a paste is the field that gets used correctly.
  const [coords, setCoords] = useState(
    branch?.latitude != null && branch?.longitude != null
      ? `${branch.latitude}, ${branch.longitude}`
      : ""
  );

  const parsedCoords = parseCoordinates(coords);
  const coordsError = coords.trim() !== "" && parsedCoords === null;

  // Cleared field -> explicit nulls, which is how a pin gets removed. The API
  // takes the pair or neither, never one half.
  const coordPayload = {
    latitude: parsedCoords?.lat ?? null,
    longitude: parsedCoords?.lng ?? null,
  };

  const save = useMutation({
    mutationFn: () =>
      branch
        ? updateBranch(branch.id, { ...form, ...coordPayload, is_active: isActive })
        : createBranch({ ...form, ...coordPayload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-branches"] });
      toast.success(branch ? "Branch updated" : "Branch created");
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Could not save the branch")),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // A half-read coordinate would otherwise save as "no pin" silently,
        // and the operator would believe they had pinned the branch.
        if (coordsError) return;
        save.mutate();
      }}
    >
      <DialogHeader>
        <DialogTitle>{branch ? `Edit ${branch.name}` : "New branch"}</DialogTitle>
        <DialogDescription>
          {branch
            ? "Update this branch's details or the postal cities it covers."
            : "Add its postal cities after creating it — reopen this branch to do that."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="branch_name">Branch name</Label>
          <Input
            id="branch_name"
            required
            placeholder="Colombo Main"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="branch_address">Address</Label>
          <Input
            id="branch_address"
            required
            placeholder="123 Galle Road, Colombo 03"
            value={form.address ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="branch_phone">Phone number</Label>
          <Input
            id="branch_phone"
            required
            inputMode="numeric"
            placeholder="0112345678"
            value={form.phone_no ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, phone_no: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="branch_coords">Map location</Label>
          <Input
            id="branch_coords"
            placeholder="6.927079, 79.861244"
            value={coords}
            onChange={(e) => setCoords(e.target.value)}
            aria-invalid={coordsError}
            aria-describedby="branch_coords_help"
          />
          <p id="branch_coords_help" className="text-xs text-muted-foreground">
            {coordsError ? (
              <span className="text-destructive">
                Enter as “latitude, longitude” — e.g. 6.927079, 79.861244.
              </span>
            ) : (
              <>
                Optional. Paste coordinates here, or mark the branch on the map below.
                Riders navigate to this pin when they drop a cross-zone parcel; without it
                the app can only search the address, which finds the wrong town when two
                share a name. Leave empty to remove the pin.
              </>
            )}
          </p>
          {/*
            The map and the text field are two ways into the same value, not a
            replacement for each other. Someone who already has the coordinates
            pastes them; someone who only knows where the place *is* finds it
            here. Picking on the map writes the field, so what gets saved is
            always the thing on screen.
          */}
          <MapLocationPicker
            latitude={parsedCoords?.lat ?? null}
            longitude={parsedCoords?.lng ?? null}
            onPick={(lat, lng) => setCoords(`${lat}, ${lng}`)}
          />
        </div>
        {branch && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending || coordsError}>
          {save.isPending ? "Saving…" : branch ? "Save changes" : "Create branch"}
        </Button>
      </DialogFooter>

      {branch && <BranchPostalCities branch={branch} />}
    </form>
  );
}

function BranchPostalCities({ branch }: { branch: Branch }) {
  const assign = useAssignPostalCitiesToBranch();
  const covered = usePostalCities({ branch_id: branch.id, limit: 100 });

  async function add(city: PostalCity) {
    try {
      await assign.mutateAsync({ branch_id: branch.id, postal_city_ids: [city.id] });
      toast.success(`${city.name} now covered by ${branch.name}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not add this postal city"));
    }
  }

  async function remove(city: PostalCity) {
    try {
      await assign.mutateAsync({ branch_id: branch.id, postal_city_ids: [city.id], detach: true });
      toast.success(`${city.name} removed from ${branch.name}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not remove this postal city"));
    }
  }

  return (
    <PostalCityAssignmentEditor
      label="Postal cities this branch covers"
      assignedCities={covered.data?.items}
      assignedLoading={covered.isFetching && !covered.data}
      isPending={assign.isPending}
      onAdd={add}
      onRemove={remove}
      emptyMessage="This branch covers no postal cities yet."
    />
  );
}
