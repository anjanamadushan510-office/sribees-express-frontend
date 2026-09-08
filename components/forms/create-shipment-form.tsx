"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useClientCities, useCreateClientOrder } from "@/lib/hooks/use-client-orders";
import { getErrorMessage } from "@/lib/api/client";
import type { CreateClientOrderPayload } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/shared/combobox";

const phone = z
  .string()
  .regex(/^[0-9]{9,12}$/, "Enter a valid phone number (9–12 digits)");

const WAYBILL_RE = /^([A-Z][0-9]{7}|[0-9]{8}|[A-Z]{2}[0-9]{6})$/;

function buildSchema(isManual: boolean) {
  return z.object({
    waybill_id: isManual
      ? z
          .string()
          .trim()
          .regex(
            WAYBILL_RE,
            "Format: A1234567, 12345678, or AB123456"
          )
      : z.string().optional(),
    order_no: z.string().trim().min(1, "Order number is required").max(20),
    customer_name: z.string().trim().min(1, "Customer name is required").max(200),
    address: z.string().trim().min(1, "Address is required").max(500),
    phone_no: phone,
    phone_no2: z.union([phone, z.literal("")]).optional(),
    city_id: z.string().min(1, "Select a city"),
    cod: z.coerce
      .number({ message: "Enter the COD amount" })
      .min(0, "COD cannot be negative")
      .max(10_000_000, "COD is too large"),
    description: z.string().trim().max(500).optional(),
    note: z.string().trim().max(500).optional(),
  });
}

type FormValues = z.input<ReturnType<typeof buildSchema>>;

export function CreateShipmentForm() {
  const router = useRouter();
  const { session } = useAuth();
  const isManual = session?.user.client?.way_bill_auto_generate === "Manual";

  const schema = useMemo(() => buildSchema(isManual), [isManual]);
  const { data: cities, isLoading: citiesLoading } = useClientCities();
  const mutation = useCreateClientOrder();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      waybill_id: "",
      order_no: "",
      customer_name: "",
      address: "",
      phone_no: "",
      phone_no2: "",
      city_id: "",
      cod: undefined,
      description: "",
      note: "",
    },
  });

  const cityOptions = useMemo(
    () => (cities ?? []).map((c) => ({ value: c.key, label: c.value })),
    [cities]
  );

  const onSubmit = (values: FormValues) => {
    const payload: CreateClientOrderPayload = {
      client_id: session?.user.client_id,
      order_no: values.order_no!,
      customer_name: values.customer_name!,
      address: values.address!,
      phone_no: values.phone_no!,
      phone_no2: values.phone_no2 || undefined,
      city_id: Number(values.city_id),
      cod: Number(values.cod),
      description: values.description || undefined,
      note: values.note || undefined,
      ...(isManual ? { waybill_id: values.waybill_id } : {}),
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Shipment created successfully");
        router.push("/shipments");
      },
      onError: (error) => {
        // Map Laravel 422 field errors onto the form where possible.
        if (axios.isAxiosError(error) && error.response?.status === 422) {
          const fieldErrors = (error.response.data?.error ?? {}) as Record<
            string,
            string[]
          >;
          let mapped = false;
          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (field in (form.getValues() as object)) {
              form.setError(field as keyof FormValues, {
                message: messages[0],
              });
              mapped = true;
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
            label="Customer name"
            error={form.formState.errors.customer_name?.message}
            className="sm:col-span-2"
          >
            <Input {...form.register("customer_name")} placeholder="Jane Perera" />
          </Field>

          <Field label="Phone number" error={form.formState.errors.phone_no?.message}>
            <Input {...form.register("phone_no")} placeholder="0771234567" inputMode="numeric" />
          </Field>

          <Field
            label="Alternate phone (optional)"
            error={form.formState.errors.phone_no2?.message}
          >
            <Input {...form.register("phone_no2")} placeholder="0112345678" inputMode="numeric" />
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
            error={form.formState.errors.address?.message}
            className="sm:col-span-2"
          >
            <Textarea
              {...form.register("address")}
              placeholder="No. 12, Main Street, Apartment 4B"
              rows={2}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parcel & payment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {isManual && (
            <Field
              label="Waybill number"
              error={form.formState.errors.waybill_id?.message}
            >
              <Input {...form.register("waybill_id")} placeholder="A1234567" />
            </Field>
          )}

          <Field label="Order number" error={form.formState.errors.order_no?.message}>
            <Input {...form.register("order_no")} placeholder="Your reference #" />
          </Field>

          <Field label="COD amount" error={form.formState.errors.cod?.message}>
            <Input
              type="number"
              step="0.01"
              {...form.register("cod")}
              placeholder="0.00"
            />
          </Field>

          <Field
            label="Description (optional)"
            error={form.formState.errors.description?.message}
            className="sm:col-span-2"
          >
            <Input {...form.register("description")} placeholder="e.g. 1x T-shirt" />
          </Field>

          <Field
            label="Note (optional)"
            error={form.formState.errors.note?.message}
            className="sm:col-span-2"
          >
            <Textarea {...form.register("note")} rows={2} placeholder="Delivery instructions" />
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
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
