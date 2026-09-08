import type { Metadata } from "next";
import { TrackingForm } from "@/components/forms/tracking-form";

export const metadata: Metadata = {
  title: "Track a package — SRIBEES Express",
};

// In Next.js 16, searchParams is async.
export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ waybill?: string }>;
}) {
  const { waybill } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Track your package</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your waybill or tracking number to see real-time delivery status.
        </p>
      </div>
      <TrackingForm initialWaybill={waybill} />
    </div>
  );
}
