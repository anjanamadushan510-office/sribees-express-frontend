"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getExpenseTypesDropdown } from "@/lib/api/dropdowns";
import { useAdminBranches } from "@/lib/hooks/use-admin-orders";
import {
  useBranchWaybillOptions,
  useCreateBranchDeposit,
} from "@/lib/hooks/use-admin-branch-finances";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
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
import { Combobox } from "@/components/shared/combobox";
import { MultiSelect } from "@/components/shared/multi-select";

export function BranchDepositFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: branches, isLoading: branchesLoading } = useAdminBranches();
  const { data: expenseTypes, isLoading: expenseTypesLoading } = useQuery({
    queryKey: ["admin-expense-types-dropdown"],
    queryFn: getExpenseTypesDropdown,
    staleTime: 60 * 60 * 1000,
  });

  const [branchId, setBranchId] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [expenses, setExpenses] = useState("0");
  const [waybillIds, setWaybillIds] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [depositDate, setDepositDate] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: waybills, isLoading: waybillsLoading } = useBranchWaybillOptions(
    branchId || null
  );
  const mutation = useCreateBranchDeposit();

  const branchOptions = useMemo(
    () => (branches ?? []).map((b) => ({ value: String(b.key), label: b.value })),
    [branches]
  );
  const expenseTypeOptions = useMemo(
    () => (expenseTypes ?? []).map((e) => ({ value: String(e.key), label: e.value })),
    [expenseTypes]
  );
  const waybillOptions = useMemo(
    () => (waybills ?? []).map((w) => ({ value: w.waybill_id, label: w.waybill_id })),
    [waybills]
  );

  const reset = () => {
    setBranchId("");
    setExpenseType("");
    setExpenses("0");
    setWaybillIds([]);
    setRemarks("");
    setDepositDate("");
    setFile(null);
  };

  const submit = () => {
    if (!branchId || !expenseType || waybillIds.length === 0) {
      toast.error("Select a branch, expense type, and at least one waybill");
      return;
    }
    mutation.mutate(
      {
        branch_id: Number(branchId),
        expenses: Number(expenses) || 0,
        expense_type: Number(expenseType),
        waybill_ids: waybillIds,
        remarks: remarks || undefined,
        deposit_date: depositDate || undefined,
        deposit_file: file ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Deposit created");
          reset();
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not create deposit")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New branch deposit</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Branch</Label>
            <Combobox
              options={branchOptions}
              value={branchId}
              onChange={(v) => {
                setBranchId(v);
                setWaybillIds([]);
              }}
              placeholder={branchesLoading ? "Loading…" : "Select branch"}
              searchPlaceholder="Search branch…"
              emptyMessage="No branch found."
              disabled={branchesLoading}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Waybills to deposit</Label>
            <MultiSelect
              options={waybillOptions}
              value={waybillIds}
              onChange={setWaybillIds}
              placeholder={
                !branchId
                  ? "Select a branch first"
                  : waybillsLoading
                    ? "Loading waybills…"
                    : "Select waybills"
              }
              searchPlaceholder="Search waybill…"
              emptyMessage="No un-deposited delivered waybills for this branch."
              disabled={!branchId || waybillsLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Expense type</Label>
              <Combobox
                options={expenseTypeOptions}
                value={expenseType}
                onChange={setExpenseType}
                placeholder={expenseTypesLoading ? "Loading…" : "Select type"}
                searchPlaceholder="Search…"
                emptyMessage="No expense type found."
                disabled={expenseTypesLoading}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Expense amount</Label>
              <Input
                type="number"
                step="0.01"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Deposit date (optional)</Label>
            <Input
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Deposit slip (optional)</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
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
            Create deposit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
