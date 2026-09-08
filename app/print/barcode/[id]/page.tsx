"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import { useClientBarcodePrint } from "@/lib/hooks/use-barcode";
import { BarcodeLabel } from "@/components/shared/barcode-label";
import { Button } from "@/components/ui/button";

/**
 * Prints one or more shipping labels. `[id]` is the primary order id; extra
 * ids can be appended via `?extra=2,3,4` to print a batch in one page.
 */
export default function PrintBarcodePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const extra = searchParams.get("extra");
  const ids = [params.id, ...(extra ? extra.split(",") : [])].filter(Boolean);

  const { data, isLoading, isError } = useClientBarcodePrint(ids);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data || data.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Couldn&apos;t load barcode label data for this order. Check your connection and try
        again.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-lg font-semibold">
          {data.length === 1 ? "Shipping label" : `${data.length} shipping labels`}
        </h1>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-1">
        {data.map((label) => (
          <BarcodeLabel key={label.oder_id} label={label} />
        ))}
      </div>
    </div>
  );
}
