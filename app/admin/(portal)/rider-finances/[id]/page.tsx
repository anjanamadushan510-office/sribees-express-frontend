"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  useApproveDeposit,
  useMakeDepositPayment,
  useRejectDeposit,
  useRiderDeposit,
} from "@/lib/hooks/use-admin-rider-finances";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MakePaymentPayload } from "@/types/admin-rider-finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminRiderDepositDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { hasPermission } = useAuth();

  const { data, isLoading, isError } = useRiderDeposit(id);
  const [dialog, setDialog] = useState<"payment" | "approve" | "reject" | null>(null);

  const deposit = data?.deposit;

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/rider-finances">
          <ArrowLeft className="size-4" />
          Back to rider finances
        </Link>
      </Button>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError || !deposit ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this deposit. It may not exist, or you may not have permission
            to view it.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{deposit.reference_no}</h1>
              <p className="text-sm text-muted-foreground">{deposit.rider.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={deposit.status.current.label} />
              {deposit.flags.is_pending && hasPermission("make-rider-deposit-payment") && (
                <Button size="sm" onClick={() => setDialog("payment")}>
                  Make Payment
                </Button>
              )}
              {deposit.flags.is_deposited && (
                <>
                  {hasPermission("approve-rider-deposit") && (
                    <Button size="sm" onClick={() => setDialog("approve")}>
                      Approve
                    </Button>
                  )}
                  {hasPermission("reject-rider-deposit") && (
                    <Button size="sm" variant="outline" onClick={() => setDialog("reject")}>
                      Reject
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Deposit details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <Detail label="Rider">{deposit.rider.name}</Detail>
                <Detail label="Contact">{deposit.rider.contact_no}</Detail>
                <Detail label="Branch">{deposit.branch?.name ?? "—"}</Detail>
                <Detail label="Collected COD">
                  {formatCurrency(deposit.amounts.collected_cod_amount)}
                </Detail>
                <Detail label="Deposit amount">
                  {formatCurrency(deposit.amounts.deposit_amount)}
                </Detail>
                <Detail label="Deposit date">{formatDate(deposit.dates.deposit_date)}</Detail>
                {deposit.payment.method && (
                  <Detail label="Payment method">{deposit.payment.method}</Detail>
                )}
                {deposit.payment.transaction_number && (
                  <Detail label="Transaction #">{deposit.payment.transaction_number}</Detail>
                )}
                {deposit.approval.approve_remarks && (
                  <Detail label="Approval remarks" className="sm:col-span-2">
                    {deposit.approval.approve_remarks}
                  </Detail>
                )}
                {deposit.approval.reject_reason && (
                  <Detail label="Rejection reason" className="sm:col-span-2">
                    {deposit.approval.reject_reason}
                  </Detail>
                )}
              </dl>
            </CardContent>
          </Card>

          {data.orders.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Orders in this deposit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waybill</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Collected COD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">{o.waybill_id}</TableCell>
                          <TableCell>{o.customer_name}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(o.collected_cod)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status history</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {deposit.status.history.map((h, i) => (
                  <li key={i} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{h.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(h.created_at)}
                      </span>
                    </div>
                    {h.reason && <p className="mt-1 text-muted-foreground">{h.reason}</p>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <MakePaymentDialog
            open={dialog === "payment"}
            onOpenChange={(o) => !o && setDialog(null)}
            depositId={id}
            suggestedAmount={deposit.amounts.collected_cod_amount}
          />
          <ApproveDialog
            open={dialog === "approve"}
            onOpenChange={(o) => !o && setDialog(null)}
            depositId={id}
          />
          <RejectDialog
            open={dialog === "reject"}
            onOpenChange={(o) => !o && setDialog(null)}
            depositId={id}
          />
        </>
      )}
    </div>
  );
}

function Detail({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function MakePaymentDialog({
  open,
  onOpenChange,
  depositId,
  suggestedAmount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositId: string;
  suggestedAmount: number | string;
}) {
  const [method, setMethod] = useState<MakePaymentPayload["payment_method"]>("cash");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [slip, setSlip] = useState<File | null>(null);
  const mutation = useMakeDepositPayment(depositId);

  const transactionRequired = method !== "cash" && method !== "other";

  const submit = () => {
    if (transactionRequired && !transactionNumber.trim()) {
      toast.error("Transaction number is required for this payment method");
      return;
    }
    mutation.mutate(
      {
        // The backend rejects any amount that doesn't exactly match the
        // deposit's collected COD, so this is locked to that value rather
        // than left free-text (see suggestedAmount below).
        deposit_amount: Number(suggestedAmount),
        payment_method: method,
        transaction_number: transactionNumber || undefined,
        payment_remarks: remarks || undefined,
        payment_slip: slip ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Payment recorded");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not record payment")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Deposit amount</Label>
            <Input value={formatCurrency(suggestedAmount)} disabled readOnly />
            <p className="mt-1 text-xs text-muted-foreground">
              Must match the deposit&apos;s collected COD exactly — not editable.
            </p>
          </div>
          <div>
            <Label className="mb-1.5 block">Payment method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as MakePaymentPayload["payment_method"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="digital_wallet">Digital wallet</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method !== "cash" && (
            <div>
              <Label className="mb-1.5 block">
                Transaction number{transactionRequired ? "" : " (optional)"}
              </Label>
              <Input
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
              />
            </div>
          )}
          <div>
            <Label className="mb-1.5 block">Payment slip (optional)</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setSlip(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, or PDF — max 5MB.</p>
          </div>
          <div>
            <Label className="mb-1.5 block">Remarks (optional)</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApproveDialog({
  open,
  onOpenChange,
  depositId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositId: string;
}) {
  const [remarks, setRemarks] = useState("");
  const mutation = useApproveDeposit(depositId);

  const submit = () => {
    mutation.mutate(
      { approve_remarks: remarks || undefined },
      {
        onSuccess: () => {
          toast.success("Deposit approved");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not approve deposit")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve deposit</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Remarks (optional)…"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  depositId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositId: string;
}) {
  const [reason, setReason] = useState("");
  const mutation = useRejectDeposit(depositId);

  const submit = () => {
    if (reason.trim().length < 10) {
      toast.error("Rejection reason must be at least 10 characters");
      return;
    }
    mutation.mutate(
      { reject_reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Deposit rejected");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not reject deposit")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject deposit</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Rejection reason (min. 10 characters)…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
