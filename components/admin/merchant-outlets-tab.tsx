"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useOutlets, useSaveOutlet } from "@/lib/hooks/use-identity";
import { searchStaffPostalCities } from "@/lib/api/dropdowns";
import type { ClientOutlet } from "@/types/identity";
import { getErrorMessage } from "@/lib/api/client";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  PostalCityPicker,
  postalCityLabel,
  type PostalCityOption,
} from "@/components/shared/postal-city-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * A merchant's locations: the shops and warehouses parcels are collected from.
 *
 * The ecommerce API manages these same rows as `/ecommerce/outlets`, so an
 * outlet added here is immediately bookable by the merchant's integration, and
 * vice versa. Retire rather than delete — orders keep a copy of where they were
 * collected from, and the retired row is what that copy came from.
 */
export function MerchantOutletsTab({ clientId }: { clientId: number }) {
  const { data: outlets, isFetching, isError, error } = useOutlets(clientId);
  const save = useSaveOutlet(clientId);
  const [editing, setEditing] = useState<ClientOutlet | "new" | null>(null);

  async function setActive(outlet: ClientOutlet, isActive: boolean) {
    try {
      await save.mutateAsync({ id: outlet.id, payload: { is_active: isActive } });
      toast.success(isActive ? "Outlet reopened" : "Outlet retired");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not change the outlet"));
    }
  }

  const columns: Column<ClientOutlet>[] = [
    { header: "Outlet", cell: (r) => <span className="font-medium">{r.name}</span> },
    { header: "Address", cell: (r) => r.address },
    { header: "Postal city", cell: (r) => postalCityLabel(r.postal_city) },
    { header: "Phone", cell: (r) => r.phone || "—" },
    {
      header: "Status",
      cell: (r) => <StatusBadge status={r.is_active ? "Active" : "Retired"} />,
    },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(r)}>
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActive(r, !r.is_active)}
            disabled={save.isPending}
          >
            {r.is_active ? "Retire" : "Reopen"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Outlets</CardTitle>
          <Button onClick={() => setEditing("new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add outlet
          </Button>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="mb-4 text-sm text-destructive">
              {error instanceof Error ? error.message : "Could not load outlets."}
            </p>
          )}
          <DataTable
            columns={columns}
            rows={outlets}
            isLoading={isFetching && !outlets}
            rowKey={(r) => r.id}
            emptyMessage="This merchant has no outlets."
          />
        </CardContent>
      </Card>

      {editing !== null && (
        <OutletDialog
          clientId={clientId}
          outlet={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function OutletDialog({
  clientId,
  outlet,
  onClose,
}: {
  clientId: number;
  outlet: ClientOutlet | null;
  onClose: () => void;
}) {
  const save = useSaveOutlet(clientId);
  const [form, setForm] = useState({
    name: outlet?.name ?? "",
    phone: outlet?.phone ?? "",
    address: outlet?.address ?? "",
  });
  const [postalCity, setPostalCity] = useState<PostalCityOption | null>(
    outlet?.postal_city ?? null
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!postalCity) {
      toast.error("Choose the outlet's postal city");
      return;
    }
    try {
      await save.mutateAsync({
        id: outlet?.id ?? null,
        payload: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          postal_city_id: postalCity.id,
        },
      });
      toast.success(outlet ? "Outlet updated" : "Outlet added");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the outlet"));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{outlet ? `Edit ${outlet.name}` : "Add an outlet"}</DialogTitle>
            <DialogDescription>
              Where a rider collects parcels. Parcels already booked keep the address
              they were booked with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="outlet_name">Name</Label>
                <Input
                  id="outlet_name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="outlet_phone">Phone</Label>
                <Input
                  id="outlet_phone"
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="outlet_address">Address</Label>
              <Textarea
                id="outlet_address"
                required
                rows={2}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="outlet_postal_city">Postal city</Label>
              <PostalCityPicker
                id="outlet_postal_city"
                queryKey="staff"
                search={searchStaffPostalCities}
                value={postalCity}
                onChange={setPostalCity}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save outlet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
