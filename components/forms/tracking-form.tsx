"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, PackageSearch, MapPin, CalendarDays } from "lucide-react";
import { trackWaybill } from "@/lib/api/tracking";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { TrackingTimeline } from "@/components/shared/tracking-timeline";
import { formatDate } from "@/lib/format";

const schema = z.object({
  waybill_id: z.string().trim().min(3, "Enter a valid waybill / tracking number"),
});
type FormValues = z.infer<typeof schema>;

export function TrackingForm({ initialWaybill }: { initialWaybill?: string }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { waybill_id: initialWaybill ?? "" },
  });

  const mutation = useMutation({
    mutationFn: (waybill: string) => trackWaybill(waybill),
  });

  // Auto-track when arriving with a pre-filled waybill (e.g. from the landing hero).
  useEffect(() => {
    if (initialWaybill && initialWaybill.length >= 3) {
      mutation.mutate(initialWaybill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWaybill]);

  const onSubmit = (values: FormValues) => mutation.mutate(values.waybill_id);
  const result = mutation.data;

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <Input
          placeholder="Enter waybill or tracking number"
          aria-label="Waybill number"
          {...form.register("waybill_id")}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PackageSearch className="size-4" />
          )}
          Track
        </Button>
      </form>
      {form.formState.errors.waybill_id && (
        <p className="text-sm text-destructive">
          {form.formState.errors.waybill_id.message}
        </p>
      )}

      {mutation.isError && (
        <Card className="border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">
            {getErrorMessage(
              mutation.error,
              "We couldn't find that waybill. Double-check the number and try again."
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">
                Waybill {result.waybill_id}
              </CardTitle>
            </div>
            <StatusBadge status={result.current_status} />
          </CardHeader>
          <CardContent className="space-y-6">
            {/*
              Recipient name, phone and address used to be shown here. They are
              gone because this page is public and a waybill number is printed
              on the outside of the parcel — anyone holding one, or guessing
              one, would have been reading a stranger's contact details. The
              signed-in portal still shows the full order to its owner.
            */}
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <Detail icon={<MapPin className="size-4" />} label="Destination">
                {result.destination_city ?? "—"}
              </Detail>
              <Detail icon={<CalendarDays className="size-4" />} label="Placed">
                {formatDate(result.created_at)}
              </Detail>
            </dl>

            <Separator />

            <div>
              <h3 className="mb-4 text-sm font-semibold">Tracking history</h3>
              <TrackingTimeline
                history={result.events
                  .slice()
                  .reverse()
                  .map((e) => ({ name: e.status_name, added_date: e.occurred_at }))}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
