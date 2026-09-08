"use client";

import { useMemo } from "react";
import {
  useAdminBranches,
  useAdminClientsDropdown,
  useAdminPrimaryStatusTypes,
  useAdminSortingLayers,
} from "@/lib/hooks/use-admin-orders";
import { getStaffDropdown } from "@/lib/api/dropdowns";
import { useQuery } from "@tanstack/react-query";
import type { BespokeFilterField } from "@/types/admin-bespoke-report";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/shared/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Renders one input per `BespokeFilterField`, dispatched by its `type`. */
export function BespokeReportFilters({
  fields,
  values,
  onChange,
}: {
  fields: BespokeFilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (fields.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map((f) => (
        <FilterField key={f.key} field={f} value={values[f.key] ?? ""} onChange={onChange} />
      ))}
    </div>
  );
}

function FilterField({
  field,
  value,
  onChange,
}: {
  field: BespokeFilterField;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const label = field.label + (field.required ? " *" : "");

  switch (field.type) {
    case "branch":
      return <BranchField field={field} label={label} value={value} onChange={onChange} />;
    case "client":
      return <ClientField field={field} label={label} value={value} onChange={onChange} />;
    case "staff":
      return <StaffField field={field} label={label} value={value} onChange={onChange} />;
    case "primary-status":
      return <StatusField field={field} label={label} value={value} onChange={onChange} />;
    case "sorting-layer":
      return <SortingLayerField field={field} label={label} value={value} onChange={onChange} />;
    case "daterange":
      return <DateRangeField field={field} label={label} value={value} onChange={onChange} />;
    case "date":
      return (
        <div>
          <Label className="mb-1.5 block text-xs">{label}</Label>
          <Input type="date" value={value} onChange={(e) => onChange(field.key, e.target.value)} />
        </div>
      );
    case "select":
      return (
        <div>
          <Label className="mb-1.5 block text-xs">{label}</Label>
          <Select value={value} onValueChange={(v) => onChange(field.key, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={field.placeholder ?? "Select…"} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "month-name":
      return (
        <div>
          <Label className="mb-1.5 block text-xs">{label}</Label>
          <Input
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder="e.g. August"
          />
        </div>
      );
    case "number":
      return (
        <div>
          <Label className="mb-1.5 block text-xs">{label}</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      );
    default:
      return (
        <div>
          <Label className="mb-1.5 block text-xs">{label}</Label>
          <Input value={value} onChange={(e) => onChange(field.key, e.target.value)} />
        </div>
      );
  }
}

function BranchField({
  field,
  label,
  value,
  onChange,
}: {
  field: BespokeFilterField;
  label: string;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const { data, isLoading } = useAdminBranches();
  const options = useMemo(
    () => (data ?? []).map((b) => ({ value: String(b.key), label: b.value })),
    [data]
  );
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <Combobox
        options={options}
        value={value}
        onChange={(v) => onChange(field.key, v)}
        placeholder={isLoading ? "Loading…" : "Select branch"}
        searchPlaceholder="Search…"
        emptyMessage="No branch found."
        disabled={isLoading}
      />
    </div>
  );
}

function ClientField({
  field,
  label,
  value,
  onChange,
}: {
  field: BespokeFilterField;
  label: string;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const { data, isLoading } = useAdminClientsDropdown();
  const options = useMemo(
    () => (data ?? []).map((c) => ({ value: String(c.key), label: c.value })),
    [data]
  );
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <Combobox
        options={options}
        value={value}
        onChange={(v) => onChange(field.key, v)}
        placeholder={isLoading ? "Loading…" : "Select client"}
        searchPlaceholder="Search…"
        emptyMessage="No client found."
        disabled={isLoading}
      />
    </div>
  );
}

function StaffField({
  field,
  label,
  value,
  onChange,
}: {
  field: BespokeFilterField;
  label: string;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-staff-dropdown"],
    queryFn: () => getStaffDropdown(),
    staleTime: 60 * 60 * 1000,
  });
  const options = useMemo(
    () => (data ?? []).map((s) => ({ value: String(s.key), label: s.value })),
    [data]
  );
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <Combobox
        options={options}
        value={value}
        onChange={(v) => onChange(field.key, v)}
        placeholder={isLoading ? "Loading…" : "Select staff"}
        searchPlaceholder="Search…"
        emptyMessage="No staff found."
        disabled={isLoading}
      />
    </div>
  );
}

function StatusField({
  field,
  label,
  value,
  onChange,
}: {
  field: BespokeFilterField;
  label: string;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const { data, isLoading } = useAdminPrimaryStatusTypes();
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(field.key, v)} disabled={isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {(data ?? []).map((s) => (
            <SelectItem key={s.key} value={s.key}>
              {s.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SortingLayerField({
  field,
  label,
  value,
  onChange,
}: {
  field: BespokeFilterField;
  label: string;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const { data, isLoading } = useAdminSortingLayers();
  const options = useMemo(
    () => (data ?? []).map((l) => ({ value: String(l.key), label: l.value })),
    [data]
  );
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <Combobox
        options={options}
        value={value}
        onChange={(v) => onChange(field.key, v)}
        placeholder={isLoading ? "Loading…" : "Select layer"}
        searchPlaceholder="Search…"
        emptyMessage="No layer found."
        disabled={isLoading}
      />
    </div>
  );
}

function DateRangeField({
  field,
  label,
  value,
  onChange,
}: {
  field: BespokeFilterField;
  label: string;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const [from, to] = value.split(" - ");

  const update = (newFrom: string, newTo: string) => {
    if (newFrom && newTo) onChange(field.key, `${newFrom} - ${newTo}`);
    else onChange(field.key, "");
  };

  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={from ?? ""}
          onChange={(e) => update(e.target.value, to ?? "")}
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input type="date" value={to ?? ""} onChange={(e) => update(from ?? "", e.target.value)} />
      </div>
    </div>
  );
}
