"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAdminBranches } from "@/lib/hooks/use-admin-orders";
import {
  useCity,
  useCreateCity,
  useDistrictsDropdown,
  useUpdateCity,
  useZonesDropdown,
} from "@/lib/hooks/use-admin-locations";
import { getErrorMessage } from "@/lib/api/client";
import type { CityDetail, SaveCityPayload } from "@/types/admin-location";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/shared/combobox";

const schema = z.object({
  name_en: z.string().trim().min(2, "At least 2 characters").max(40),
  postcode: z.string().optional(),
  district_id: z.string().min(1, "Select a district"),
  zone_id: z.string().min(1, "Select a zone"),
  branch_id: z.string().min(1, "Select a branch"),
});

type FormValues = z.infer<typeof schema>;

export function CityFormDialog({
  open,
  onOpenChange,
  cityId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode. */
  cityId: number | null;
}) {
  const isEdit = cityId !== null;
  const { data: city, isLoading: cityLoading } = useCity(isEdit ? cityId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit city" : "New city"}</DialogTitle>
        </DialogHeader>

        {isEdit && cityLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : isEdit && !city ? (
          <p className="text-sm text-muted-foreground">Could not load this city.</p>
        ) : (
          <CityForm
            key={cityId ?? "new"}
            cityId={cityId}
            city={city ?? null}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CityForm({
  cityId,
  city,
  onDone,
}: {
  cityId: number | null;
  city: CityDetail | null;
  onDone: () => void;
}) {
  const isEdit = cityId !== null;
  const { data: districts, isLoading: districtsLoading } = useDistrictsDropdown();
  const { data: zones, isLoading: zonesLoading } = useZonesDropdown();
  const { data: branches, isLoading: branchesLoading } = useAdminBranches();
  const createMutation = useCreateCity();
  const updateMutation = useUpdateCity(cityId ?? 0);
  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name_en: city?.name_en ?? "",
      postcode: city?.postcode != null ? String(city.postcode) : "",
      district_id: city?.district_id != null ? String(city.district_id) : "",
      zone_id: city?.zone_id != null ? String(city.zone_id) : "",
      branch_id: city?.branch_id != null ? String(city.branch_id) : "",
    },
  });

  const districtOptions = useMemo(
    () => (districts ?? []).map((d) => ({ value: String(d.key), label: d.value })),
    [districts]
  );
  const zoneOptions = useMemo(
    () => (zones ?? []).map((z) => ({ value: String(z.key), label: z.value })),
    [zones]
  );
  const branchOptions = useMemo(
    () => (branches ?? []).map((b) => ({ value: String(b.key), label: b.value })),
    [branches]
  );

  const onSubmit = (values: FormValues) => {
    const payload: SaveCityPayload = {
      name_en: values.name_en,
      postcode: values.postcode ? Number(values.postcode) : undefined,
      district_id: Number(values.district_id),
      zone_id: Number(values.zone_id),
      branch_id: Number(values.branch_id),
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? "City updated" : "City created");
        onDone();
      },
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 422) {
          const fieldErrors = (error.response.data?.error ?? {}) as Record<
            string,
            string[]
          >;
          let mapped = false;
          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (field in (form.getValues() as object)) {
              form.setError(field as keyof FormValues, { message: messages[0] });
              mapped = true;
            }
          }
          if (mapped) {
            toast.error("Please fix the highlighted fields");
            return;
          }
        }
        toast.error(getErrorMessage(error, "Could not save city"));
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <Field label="City name" error={form.formState.errors.name_en?.message}>
        <Input {...form.register("name_en")} placeholder="Nugegoda" />
      </Field>
      <Field label="Postcode (optional)" error={form.formState.errors.postcode?.message}>
        <Input {...form.register("postcode")} inputMode="numeric" placeholder="10250" />
      </Field>
      <Field label="District" error={form.formState.errors.district_id?.message}>
        <Combobox
          options={districtOptions}
          value={form.watch("district_id")}
          onChange={(v) => form.setValue("district_id", v, { shouldValidate: true })}
          placeholder={districtsLoading ? "Loading…" : "Select district"}
          searchPlaceholder="Search district…"
          emptyMessage="No district found."
          disabled={districtsLoading}
        />
      </Field>
      <Field label="Zone" error={form.formState.errors.zone_id?.message}>
        <Combobox
          options={zoneOptions}
          value={form.watch("zone_id")}
          onChange={(v) => form.setValue("zone_id", v, { shouldValidate: true })}
          placeholder={zonesLoading ? "Loading…" : "Select zone"}
          searchPlaceholder="Search zone…"
          emptyMessage="No zone found."
          disabled={zonesLoading}
        />
      </Field>
      <Field label="Branch" error={form.formState.errors.branch_id?.message}>
        <Combobox
          options={branchOptions}
          value={form.watch("branch_id")}
          onChange={(v) => form.setValue("branch_id", v, { shouldValidate: true })}
          placeholder={branchesLoading ? "Loading…" : "Select branch"}
          searchPlaceholder="Search branch…"
          emptyMessage="No branch found."
          disabled={branchesLoading}
        />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create city"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
