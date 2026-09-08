"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { getExpenseTypesDropdown } from "@/lib/api/dropdowns";
import {
  useAcceptBranchDepositPayment,
  useAcceptPaymentView,
  useApproveBranchDeposit,
  useBranchDeposit,
  useBranchDepositEditInfo,
  useRejectBranchDeposit,
  useUpdateBranchDeposit,
} from "@/lib/hooks/use-admin-branch-finances";
import { getErrorMessage } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AcceptPaymentPayload } from "@/types/admin-branch-finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Combobox } from "@/components/shared/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminBranchDepositDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { hasPermission } = useAuth();

  const { data, isLoading, isError } = useBranchDeposit(id);
  const approveMutation = useApproveBranchDeposit(id);
  const rejectMutation = useRejectBranchDeposit(id);
  const [dialog, setDialog] = useState<"edit" | "accept-payment" | null>(null);

  const deposit = data?.branchDeposit;

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/branch-finances">
          <ArrowLeft className="size-4" />
          Back to branch finances
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
              <h1 className="text-2xl font-bold tracking-tight">{deposit.branch_name}</h1>
              <p className="text-sm text-muted-foreground">
                Deposit on {formatDate(deposit.deposit_date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(hasPermission("edit-deposit") || hasPermission("limited-edit-deposit")) && (
                <Button size="sm" variant="outline" onClick={() => setDialog("edit")}>
                  Add expenses
                </Button>
              )}
              {hasPermission("accept-payment") && (
                <Button size="sm" variant="outline" onClick={() => setDialog("accept-payment")}>
                  Accept payment
                </Button>
              )}
            </div>
            {hasPermission("approved-deposit") && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={approveMutation.isPending}
                  onClick={() =>
                    approveMutation.mutate(undefined, {
                      onSuccess: () => toast.success("Deposit approved"),
                      onError: (error) =>
                        toast.error(getErrorMessage(error, "Could not approve deposit")),
                    })
                  }
                >
                  {approveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={rejectMutation.isPending}
                  onClick={() => {
                    if (!window.confirm("Reject this branch deposit?")) return;
                    rejectMutation.mutate(undefined, {
                      onSuccess: () => toast.success("Deposit rejected"),
                      onError: (error) =>
                        toast.error(getErrorMessage(error, "Could not reject deposit")),
                    });
                  }}
                >
                  {rejectMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Reject
                </Button>
              </div>
            )}
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Deposit summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <Detail label="Total collected COD">
                  {formatCurrency(deposit.total_collected_cod)}
                </Detail>
                <Detail label="Expenses">{formatCurrency(deposit.expenses)}</Detail>
                <Detail label="Deposit amount">{formatCurrency(deposit.deposit_amount)}</Detail>
                <Detail label="Attachment">{data.mediaFileName}</Detail>
                {deposit.remarks && (
                  <Detail label="Remarks" className="sm:col-span-2">
                    {deposit.remarks}
                  </Detail>
                )}
              </dl>
            </CardContent>
          </Card>

          {data.expense_detail.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {data.expense_detail.map((e, i) => (
                    <li key={i} className="flex items-center justify-between rounded-md border p-2">
                      <span>{e.expense_name}</span>
                      <span className="font-medium">{formatCurrency(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data.order_detail.length > 0 && (
            <Card>
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
                        <TableHead>Rider</TableHead>
                        <TableHead className="text-right">Collected COD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.order_detail.map((o) => (
                        <TableRow key={o.waybill_id}>
                          <TableCell className="font-medium">{o.waybill_id}</TableCell>
                          <TableCell>{o.customer_name}</TableCell>
                          <TableCell>{o.rider_name ?? "—"}</TableCell>
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

          <EditDepositDialog
            open={dialog === "edit"}
            onOpenChange={(o) => !o && setDialog(null)}
            depositId={id}
          />
          <AcceptPaymentDialog
            open={dialog === "accept-payment"}
            onOpenChange={(o) => !o && setDialog(null)}
            depositId={id}
          />
        </>
      )}
    </div>
  );
}

function EditDepositDialog({
  open,
  onOpenChange,
  depositId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositId: string;
}) {
  const { data: editInfo, isLoading } = useBranchDepositEditInfo(open ? depositId : null);
  const { data: expenseTypes } = useQuery({
    queryKey: ["admin-expense-types-dropdown"],
    queryFn: getExpenseTypesDropdown,
    staleTime: 60 * 60 * 1000,
  });
  const mutation = useUpdateBranchDeposit(depositId);
  const [lines, setLines] = useState<{ expense_id: string; amount: string }[]>([
    { expense_id: "", amount: "" },
  ]);
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const expenseTypeOptions = useMemo(
    () => (expenseTypes ?? []).map((e) => ({ value: String(e.key), label: e.value })),
    [expenseTypes]
  );

  const submit = () => {
    const addMoreInputFields = lines
      .filter((l) => l.expense_id && Number(l.amount) > 0)
      .map((l) => ({ expense_id: Number(l.expense_id), amount: Number(l.amount) }));
    if (addMoreInputFields.length === 0) {
      toast.error("Add at least one expense line with an amount greater than 0");
      return;
    }
    mutation.mutate(
      { addMoreInputFields, remarks: remarks || undefined, deposit_file: file ?? undefined },
      {
        onSuccess: () => {
          toast.success("Submitted for approval");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not submit updates")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add expense lines</DialogTitle>
        </DialogHeader>
        {!isLoading && editInfo && (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            Currently approved expenses total: {formatCurrency(editInfo.total_amount)}
            {editInfo.pending_expenses.length > 0 && (
              <p className="mt-1">
                {editInfo.pending_expenses.length} expense line(s) already pending approval.
              </p>
            )}
          </div>
        )}
        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
              <div>
                <Label className="mb-1.5 block text-xs">Expense type</Label>
                <Combobox
                  options={expenseTypeOptions}
                  value={line.expense_id}
                  onChange={(v) =>
                    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, expense_id: v } : l)))
                  }
                  placeholder="Select type"
                  searchPlaceholder="Search…"
                  emptyMessage="No expense type found."
                />
              </div>
              <div className="w-28">
                <Label className="mb-1.5 block text-xs">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={line.amount}
                  onChange={(e) =>
                    setLines((ls) =>
                      ls.map((l, idx) => (idx === i ? { ...l, amount: e.target.value } : l))
                    )
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                disabled={lines.length === 1}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((ls) => [...ls, { expense_id: "", amount: "" }])}
          >
            Add another line
          </Button>
          <div>
            <Label className="mb-1.5 block">Deposit slip (optional)</Label>
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
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
            Submit for approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AcceptPaymentDialog({
  open,
  onOpenChange,
  depositId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositId: string;
}) {
  const { data: view } = useAcceptPaymentView(open ? depositId : null);
  const mutation = useAcceptBranchDepositPayment(depositId);
  const [paymentDate, setPaymentDate] = useState("");
  const [depositType, setDepositType] =
    useState<AcceptPaymentPayload["deposit_type"]>("Bank Deposit (HNB)");

  const effectiveDate = paymentDate || view?.today_date || "";

  const submit = () => {
    if (!effectiveDate) {
      toast.error("Select a payment date");
      return;
    }
    mutation.mutate(
      { payment_date: effectiveDate, deposit_type: depositType },
      {
        onSuccess: () => {
          toast.success("Payment accepted");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not accept payment")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accept payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Payment date</Label>
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Deposit type</Label>
            <Select
              value={depositType}
              onValueChange={(v) => setDepositType(v as AcceptPaymentPayload["deposit_type"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank Deposit (HNB)">Bank Deposit (HNB)</SelectItem>
                <SelectItem value="Bank Deposit (Sampath)">Bank Deposit (Sampath)</SelectItem>
              </SelectContent>
            </Select>
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
