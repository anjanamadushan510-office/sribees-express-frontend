"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import {
  useClientWaybillRequests,
  useCreateClientWaybillRequest,
} from "@/lib/hooks/use-waybill-requests";
import { getErrorMessage } from "@/lib/api/client";
import type { ClientWaybillRequestRow } from "@/types/waybill-request";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PER_PAGE = 15;

const columns: Column<ClientWaybillRequestRow>[] = [
  { header: "Requested", cell: (r) => formatDate(r.request_date) },
  { header: "Waybills", className: "text-right", cell: (r) => r.no_of_waybills },
  { header: "Barcodes", className: "text-right", cell: (r) => r.no_of_barcodes },
  { header: "From", cell: (r) => r.from_barcode ?? "—" },
  { header: "To", cell: (r) => r.to_barcode ?? "—" },
  { header: "Confirmed", cell: (r) => formatDate(r.confirm_date) },
  { header: "Status", cell: (r) => <StatusBadge status={r.request_status} /> },
];

export default function WaybillRequestsPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isFetching, isError } = useClientWaybillRequests({ page, perPage: PER_PAGE });

  return (
    <>
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Waybill Requests"
          description="Request a new range of waybill numbers and barcodes."
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New Request
        </Button>
      </div>
      <CreateWaybillRequestDialog open={createOpen} onOpenChange={setCreateOpen} />

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load your waybill requests right now. Check your connection and try
            again.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No waybill requests yet."
          />
          <Pagination pagination={data?.pagination} onPageChange={setPage} isLoading={isFetching} />
        </>
      )}
    </>
  );
}

function CreateWaybillRequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [quantity, setQuantity] = useState("100");
  const [barcodeQuantity, setBarcodeQuantity] = useState("100");
  const mutation = useCreateClientWaybillRequest();

  const submit = () => {
    const q = Number(quantity);
    const b = Number(barcodeQuantity);
    if (!q || q < 1 || q > 10000) {
      toast.error("Waybill quantity must be between 1 and 10,000");
      return;
    }
    if (!b || b < 1 || b > 1000) {
      toast.error("Barcode quantity must be between 1 and 1,000");
      return;
    }
    mutation.mutate(
      { quantity: q, barcode_quantity: b },
      {
        onSuccess: () => {
          toast.success("Waybill request submitted");
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error(getErrorMessage(error, "Could not submit waybill request")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a waybill range</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Number of waybills</Label>
            <Input
              type="number"
              min={1}
              max={10000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Number of barcodes</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={barcodeQuantity}
              onChange={(e) => setBarcodeQuantity(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Only one request can be submitted per day. SRIBEES will confirm the assigned range
            once reviewed.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
