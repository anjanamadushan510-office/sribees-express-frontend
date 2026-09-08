"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import type { BarcodeLabel as BarcodeLabelData } from "@/types/barcode";
import { formatCurrency } from "@/lib/format";

/** One printable shipping label (waybill barcode + delivery details). */
export function BarcodeLabel({ label }: { label: BarcodeLabelData }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, label.waybill_id, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        height: 50,
        margin: 4,
      });
    } catch {
      // Some waybill formats aren't valid CODE128 input in rare edge cases —
      // fail silently, the text fields below still show the waybill number.
    }
  }, [label.waybill_id]);

  return (
    <div className="break-inside-avoid rounded-lg border p-4 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{label.client_name}</p>
          <p className="text-xs text-muted-foreground">{label.client_address}</p>
          <p className="text-xs text-muted-foreground">{label.client_business_phone_no}</p>
        </div>
        <p className="text-xs text-muted-foreground">{label.date}</p>
      </div>

      <div className="my-3 flex justify-center">
        <svg ref={svgRef} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">Customer</dt>
        <dd className="text-right">{label.customer_name}</dd>
        <dt className="text-muted-foreground">Phone</dt>
        <dd className="text-right">{label.customer_phone_no ?? "—"}</dd>
        <dt className="text-muted-foreground">Address</dt>
        <dd className="col-span-2">{label.customer_address ?? "—"}</dd>
        <dt className="text-muted-foreground">COD</dt>
        <dd className="text-right">{formatCurrency(label.cod)}</dd>
        <dt className="text-muted-foreground">Branch</dt>
        <dd className="text-right">{label.branch_name ?? "—"}</dd>
        {label.order_no && (
          <>
            <dt className="text-muted-foreground">Order #</dt>
            <dd className="text-right">{label.order_no}</dd>
          </>
        )}
        {label.description && (
          <>
            <dt className="text-muted-foreground">Description</dt>
            <dd className="col-span-2">{label.description}</dd>
          </>
        )}
        {label.remarks && (
          <>
            <dt className="text-muted-foreground">Remarks</dt>
            <dd className="col-span-2">{label.remarks}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
