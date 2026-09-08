"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  useClientInfoMeta,
  useClientInformation,
  useStaffDropdown,
  useUpdateRegisteredDetails,
  useUpdateTraining,
  useUpdateWaybillSettings,
} from "@/lib/hooks/use-admin-clients";
import { useAdminBranches, useAdminCities } from "@/lib/hooks/use-admin-orders";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { ClientInfoMeta, ClientInformationDetail } from "@/types/admin-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/shared/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ClientSettingsTab({ clientId }: { clientId: number }) {
  return (
    <div className="space-y-6">
      <WaybillSettingsCard clientId={clientId} />
      <RegisteredDetailsCard clientId={clientId} />
      <TrainingCard clientId={clientId} />
    </div>
  );
}

function WaybillSettingsCard({ clientId }: { clientId: number }) {
  const { data, isLoading, isError } = useClientInformation(clientId);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError || !data)
    return (
      <p className="text-sm text-muted-foreground">
        Couldn&apos;t load waybill settings for this client.
      </p>
    );

  return <WaybillSettingsForm key={clientId} clientId={clientId} data={data} />;
}

function WaybillSettingsForm({
  clientId,
  data,
}: {
  clientId: number;
  data: ClientInformationDetail;
}) {
  const { data: cities, isLoading: citiesLoading } = useAdminCities();
  const { data: branches, isLoading: branchesLoading } = useAdminBranches();
  const mutation = useUpdateWaybillSettings(clientId);

  const [autoGenerate, setAutoGenerate] = useState<"Auto" | "Manual">(
    data.way_bill_auto_generate === "Manual" ? "Manual" : "Auto"
  );
  const [nearestCity, setNearestCity] = useState(
    data.nearest_city != null ? String(data.nearest_city) : ""
  );
  const [pickupBranch, setPickupBranch] = useState(data.pickup_branch ?? "");
  const [multiBusiness, setMultiBusiness] = useState(!!data.is_multiple_business_active);

  const cityOptions = useMemo(
    () => (cities ?? []).map((c) => ({ value: String(c.key), label: c.value })),
    [cities]
  );
  // pickup_branch is validated against `branches.name`, not an id — the dropdown's
  // `value` is the branch name string, so it doubles as both option value and label.
  const branchOptions = useMemo(
    () => (branches ?? []).map((b) => ({ value: b.value, label: b.value })),
    [branches]
  );

  const submit = () => {
    if (!nearestCity || !pickupBranch) {
      toast.error("Select a nearest city and pickup branch");
      return;
    }
    mutation.mutate(
      {
        way_bill_auto_generate: autoGenerate,
        nearest_city: Number(nearestCity),
        pickup_branch: pickupBranch,
        is_multiple_business_active: multiBusiness,
      },
      {
        onSuccess: () => toast.success("Waybill settings updated"),
        onError: (error) => toast.error(getErrorMessage(error, "Could not save settings")),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Waybill & branch settings</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Waybill generation</Label>
          <Select value={autoGenerate} onValueChange={(v) => setAutoGenerate(v as "Auto" | "Manual")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Auto">Auto</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">Multiple business accounts</Label>
          <Select
            value={multiBusiness ? "yes" : "no"}
            onValueChange={(v) => setMultiBusiness(v === "yes")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">Nearest city</Label>
          <Combobox
            options={cityOptions}
            value={nearestCity}
            onChange={setNearestCity}
            placeholder={citiesLoading ? "Loading…" : "Select city"}
            searchPlaceholder="Search city…"
            emptyMessage="No city found."
            disabled={citiesLoading}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Pickup branch</Label>
          <Combobox
            options={branchOptions}
            value={pickupBranch}
            onChange={setPickupBranch}
            placeholder={branchesLoading ? "Loading…" : "Select branch"}
            searchPlaceholder="Search branch…"
            emptyMessage="No branch found."
            disabled={branchesLoading}
          />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RegisteredDetailsCard({ clientId }: { clientId: number }) {
  const { data, isLoading, isError } = useClientInformation(clientId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (isError || !data)
    return (
      <p className="text-sm text-muted-foreground">
        Couldn&apos;t load registration details for this client.
      </p>
    );

  return <RegisteredDetailsForm key={clientId} clientId={clientId} data={data} />;
}

function RegisteredDetailsForm({
  clientId,
  data,
}: {
  clientId: number;
  data: ClientInformationDetail;
}) {
  const mutation = useUpdateRegisteredDetails(clientId);
  const [regNo, setRegNo] = useState((data.registration_no as string | null) ?? "");
  const [regDate, setRegDate] = useState(
    ((data.registration_date as string | null) ?? "").slice(0, 10)
  );

  const submit = () => {
    mutation.mutate(
      { registration_no: regNo || undefined, registration_date: regDate || undefined },
      {
        onSuccess: () => toast.success("Registration details updated"),
        onError: (error) => toast.error(getErrorMessage(error, "Could not save details")),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Business registration</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Registration number</Label>
          <Input value={regNo} onChange={(e) => setRegNo(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block">Registration date</Label>
          <Input type="date" value={regDate} onChange={(e) => setRegDate(e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TrainingCard({ clientId }: { clientId: number }) {
  const { data, isLoading, isError } = useClientInfoMeta(clientId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (isError || !data)
    return (
      <p className="text-sm text-muted-foreground">
        Couldn&apos;t load onboarding details for this client.
      </p>
    );

  return <TrainingForm key={clientId} clientId={clientId} data={data} />;
}

function TrainingForm({ clientId, data }: { clientId: number; data: ClientInfoMeta }) {
  const { data: staff, isLoading: staffLoading } = useStaffDropdown();
  const mutation = useUpdateTraining(clientId);
  const [trainedById, setTrainedById] = useState(
    data.trained_by_id != null ? String(data.trained_by_id) : ""
  );
  const [trainedAt, setTrainedAt] = useState((data.trained_at ?? "").slice(0, 10));

  const staffOptions = useMemo(
    () => (staff ?? []).map((s) => ({ value: String(s.key), label: s.value })),
    [staff]
  );

  const submit = () => {
    if (!trainedById || !trainedAt) {
      toast.error("Select who trained this client and when");
      return;
    }
    mutation.mutate(
      { trained_by_id: Number(trainedById), trained_at: trainedAt },
      {
        onSuccess: () => toast.success("Training details updated"),
        onError: (error) => toast.error(getErrorMessage(error, "Could not save details")),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Onboarding & training</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Registered
            </dt>
            <dd className="mt-0.5">{formatDate(data.register_date)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              First activated
            </dt>
            <dd className="mt-0.5">
              {formatDate(data.activate_date)}
              {data.activated_by && ` by ${data.activated_by}`}
            </dd>
          </div>
        </dl>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Trained by</Label>
            <Combobox
              options={staffOptions}
              value={trainedById}
              onChange={setTrainedById}
              placeholder={staffLoading ? "Loading…" : "Select staff member"}
              searchPlaceholder="Search staff…"
              emptyMessage="No staff found."
              disabled={staffLoading}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Trained on</Label>
            <Input type="date" value={trainedAt} onChange={(e) => setTrainedAt(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
