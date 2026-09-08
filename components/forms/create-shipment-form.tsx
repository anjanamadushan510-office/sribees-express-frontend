"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useClientCities, useCreateClientOrder } from "@/lib/hooks/use-client-orders";
import { getErrorMessage } from "@/lib/api/client";
import type { CreateClientOrderPayload } from "@/types/order";
import type { ValidationErrorItem } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/shared/combobox";

const phone = z
  .string()
  .regex(/^[0-9]{9,12}$/, "Enter a valid phone number (9–12 digits)");

/**
 * Only the fields `POST /client-portal/orders` actually accepts.
 *
 * Gone from the old form, and each for the same reason — the API has nowhere
 * to put them, so collecting them would have shown the customer a promise the
 * request does not carry: a manual waybill number (the backend allocates it),
 * a client-side order reference, a second phone number, a parcel description,
 * and a delivery note. See docs/API-GAPS.md.
 */
const schema = z.object({
  recipient_name: z.string().trim().min(1, "Recipient name is required").max(200),
  recipient_phone: phone,
  recipient_address: z.string().trim().min(1, "Address is required").max(500),
  city_id: z.string().min(1, "Select a city"),
  weight_kg: z.coerce
    .number({ message: "Enter the parcel weight" })
    .positive("Weight must be greater than zero")
    .max(1000, "That weight looks wrong"),
  cod_amount: z.coerce
    .number({ message: "Enter the COD amount" })
    .min(0, "COD cannot be negative")
    .max(10_000_000, "COD is too large"),
});
type FormValues = z.input<typeof schema>;

export function CreateShipmentForm() {
  const router = useRouter();
  const { data: cities, isLoading: citiesLoading } = useClientCities();
  const mutation = useCreateClientOrder();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      recipient_name: "",
      recipient_phone: "",
      recipient_address: "",
      city_id: "",
      weight_kg: undefined,
      cod_amount: undefined,
    },
  });

  const cityOptions = useMemo(
    () => (cities ?? []).map((c) => ({ value: c.key, label: c.value })),
    [cities]
  );

  const onSubmit = (values: FormValues) => {
    // No client_id in the payload: the backend derives it from the token, so
    // the browser cannot book an order against someone else's account.
    const payload: CreateClientOrderPayload = {
      recipient_name: values.recipient_name!,
      recipient_phone: values.recipient_phone!,
      recipient_address: values.recipient_address!,
      city_id: Number(values.city_id),
      // Sent as strings: these are NUMERIC columns server-side, and a float
      // round-trip is exactly what you do not want on a money field.
      weight_kg: String(values.weight_kg),
      cod_amount: String(values.cod_amount),
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Shipment created successfully");
        router.push("/shipments");
      },
      onError: (error) => {
        // FastAPI 422s come back as `detail: [{loc, msg}]`, where `loc` is
        // ["body", "<field>"] — map those onto the form so the message lands on
        // the input that caused it rather than in a toast the user has to
        // translate back into a field.
        if (axios.isAxiosError(error) && error.response?.status === 422) {
          const detail = error.response.data?.detail;
          let mapped = false;
          if (Array.isArray(detail)) {
            for (const item of detail as ValidationErrorItem[]) {
              const field = item.loc?.[item.loc.length - 1];
              if (typeof field === "string" && field in (form.getValues() as object)) {
                form.setError(field as keyof FormValues, { message: item.msg });
                mapped = true;
              }
            }
          }
          if (mapped) {
            toast.error("Please fix the highlighted fields");
            return;
          }
        }
        toast.error(getErrorMessage(error, "Could not create the shipment"));
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recipient details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Recipient name"
            error={form.formState.errors.recipient_name?.message}
            className="sm:col-span-2"
          >
            <Input {...form.register("recipient_name")} placeholder="Jane Perera" />
          </Field>

          <Field
            label="Phone number"
            error={form.formState.errors.recipient_phone?.message}
          >
            <Input
              {...form.register("recipient_phone")}
              placeholder="0771234567"
              inputMode="numeric"
            />
          </Field>

          <Field label="City" error={form.formState.errors.city_id?.message}>
            <Combobox
              options={cityOptions}
              value={form.watch("city_id")}
              onChange={(v) => form.setValue("city_id", v, { shouldValidate: true })}
              placeholder={citiesLoading ? "Loading cities…" : "Select a city"}
              searchPlaceholder="Search city…"
              emptyMessage="No city found."
              disabled={citiesLoading}
            />
          </Field>

          <Field
            label="Delivery address"
            error={form.formState.errors.recipient_address?.message}
            className="sm:col-span-2"
          >
            <Textarea
              {...form.register("recipient_address")}
              placeholder="No. 12, Main Street, Apartment 4B"
              rows={2}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parcel &amp; payment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Weight (kg)" error={form.formState.errors.weight_kg?.message}>
            <Input
              type="number"
              step="0.01"
              {...form.register("weight_kg")}
              placeholder="1.00"
            />
          </Field>

          <Field label="COD amount" error={form.formState.errors.cod_amount?.message}>
            <Input
              type="number"
              step="0.01"
              {...form.register("cod_amount")}
              placeholder="0.00"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/shipments")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Create Shipment
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
