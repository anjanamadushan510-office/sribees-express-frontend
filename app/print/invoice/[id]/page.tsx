"use client";

import { useParams } from "next/navigation";
import { Loader2, Printer } from "lucide-react";
import { usePrintInvoice } from "@/lib/hooks/use-finances";
import { formatCurrency, formatDateOnly } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function PrintInvoicePage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = usePrintInvoice(params.id);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        Couldn&apos;t load this invoice for printing. Check your connection and try again.
      </p>
    );
  }

  const client = data.client_details[0];
  const taxLines = Object.entries(data.tax_details)
    .filter(([key]) => key !== "total_tax")
    .map(([, v]) => v as { tax_name?: string; tax_rate?: string | number; tax_amount?: string | number });
  const totalTax = (data.tax_details as Record<string, unknown>).total_tax;

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-lg font-semibold">Invoice {client?.inv_no}</h1>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>

      <header className="flex items-start justify-between border-b pb-4">
        <div>
          <p className="text-xl font-bold text-primary">SRIBEES Express</p>
          <p className="text-xs text-muted-foreground">Courier &amp; Logistics</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">Invoice #{client?.inv_no}</p>
          <p className="text-muted-foreground">{formatDateOnly(client?.created_at)}</p>
        </div>
      </header>

      {client && (
        <section className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Billed to</p>
            <p className="font-medium">{client.name}</p>
            <p className="text-muted-foreground">{client.address}</p>
            {client.tax_number && (
              <p className="text-muted-foreground">Tax No: {client.tax_number}</p>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">Zone breakdown</h2>
        <PrintTable
          headers={["Zone", "Orders", "COD collected", "Delivery charge", "Commission", "Total"]}
          rows={data.rate_data.zones.map((z) => [
            z.zone_name,
            String(z.order_count),
            formatCurrency(z.total_cod_collected),
            formatCurrency(z.delivery_charge),
            formatCurrency(z.commission),
            formatCurrency(z.total_charges ?? Number(z.delivery_charge) + Number(z.commission)),
          ])}
          footer={[
            "Total",
            String(data.rate_data.total_order_count),
            formatCurrency(data.rate_data.total_cod_collected),
            formatCurrency(data.rate_data.total_delivery_charge),
            formatCurrency(data.rate_data.total_commission),
            formatCurrency(data.rate_data.total_charges),
          ]}
        />
      </section>

      {taxLines.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Tax</h2>
          <PrintTable
            headers={["Tax", "Rate", "Amount"]}
            rows={taxLines.map((t) => [
              String(t.tax_name ?? "—"),
              String(t.tax_rate ?? "—"),
              formatCurrency(t.tax_amount ?? 0),
            ])}
          />
          {totalTax != null && (
            <p className="mt-1 text-right text-sm font-medium">
              Total tax: {formatCurrency(totalTax as number | string)}
            </p>
          )}
        </section>
      )}

      <section className="rounded-lg border p-4 text-sm">
        <h2 className="mb-2 font-semibold">Account statement</h2>
        <dl className="grid grid-cols-2 gap-y-1">
          <dt className="text-muted-foreground">COD collected</dt>
          <dd className="text-right">{data.customer_account_statement.total_cod_collected}</dd>
          <dt className="text-muted-foreground">Charges</dt>
          <dd className="text-right">{data.customer_account_statement.total_charges}</dd>
          <dt className="text-muted-foreground">Tax</dt>
          <dd className="text-right">{data.customer_account_statement.total_tax}</dd>
          <dt className="text-muted-foreground">Setoff amount</dt>
          <dd className="text-right">{data.customer_account_statement.total_setoff_amount}</dd>
          <dt className="font-semibold">Net payable</dt>
          <dd className="text-right font-semibold">
            {data.customer_account_statement.net_payable}
          </dd>
        </dl>
      </section>

      {data.invoice_details.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Orders</h2>
          <PrintTable
            headers={["Waybill", "City", "COD", "Collected", "Delivery charge", "Commission", "Payable", "Status"]}
            rows={data.invoice_details.map((o) => [
              o.waybill_id,
              o.city_name,
              formatCurrency(o.cod),
              formatCurrency(o.collected_cod),
              formatCurrency(o.delivery_charge),
              formatCurrency(o.total_commission),
              formatCurrency(o.payable),
              o.status ?? "—",
            ])}
          />
        </section>
      )}

      {data.setoff_invoice_details.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Setoff invoices</h2>
          <PrintTable
            headers={["ID", "COD", "Collected", "Delivery charge", "Tax", "Commission", "Payable", "Status"]}
            rows={data.setoff_invoice_details.map((s) => [
              String(s.id),
              s.cod,
              s.collected_cod,
              s.d_charge,
              s.tax,
              s.commission,
              s.payable,
              s.status_name ?? "—",
            ])}
          />
        </section>
      )}
    </div>
  );
}

function PrintTable({
  headers,
  rows,
  footer,
}: {
  headers: string[];
  rows: string[][];
  footer?: string[];
}) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b">
          {headers.map((h, i) => (
            <th
              key={i}
              className={`py-1.5 text-left font-medium text-muted-foreground ${i > 0 ? "text-right" : ""}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="border-b last:border-0">
            {row.map((cell, c) => (
              <td key={c} className={`py-1.5 ${c > 0 ? "text-right" : ""}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer && (
        <tfoot>
          <tr className="border-t font-medium">
            {footer.map((cell, c) => (
              <td key={c} className={`py-1.5 ${c > 0 ? "text-right" : ""}`}>
                {cell}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  );
}
