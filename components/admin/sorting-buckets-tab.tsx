"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  useCloseSortingBucket,
  useOpenSortingBucket,
  useShiftType,
  useSortingBucketOptions,
  useSortingBuckets,
} from "@/lib/hooks/use-admin-sorting";
import { getErrorMessage } from "@/lib/api/client";
import type { OpenSortingBucketPayload, SortingBucketRow } from "@/types/admin-sorting";
import { formatDate } from "@/lib/format";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/shared/combobox";
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

const PER_PAGE = 15;

export function SortingBucketsTab() {
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const { data, isFetching, isError } = useSortingBuckets({ page, perPage: PER_PAGE });
  const closeMutation = useCloseSortingBucket();

  const columns: Column<SortingBucketRow>[] = [
    {
      header: "Center",
      cell: (r) => r.sortingCenter?.name ?? r.sorting_center?.name ?? `#${r.sorting_center_id}`,
    },
    {
      header: "Section",
      cell: (r) => r.sortingSection?.name ?? r.sorting_section?.name ?? `#${r.sorting_section_id}`,
    },
    { header: "Type", cell: (r) => r.operation_type },
    { header: "Opened", cell: (r) => formatDate(r.open_at) },
    { header: "Closed", cell: (r) => formatDate(r.close_at) },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      header: "",
      cell: (r) =>
        r.status === "Open" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={closeMutation.isPending}
            onClick={() =>
              closeMutation.mutate(r.id, {
                onSuccess: () => toast.success("Bucket closed"),
                onError: (error) =>
                  toast.error(getErrorMessage(error, "Could not close bucket")),
              })
            }
          >
            Close
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="size-4" />
          Open bucket
        </Button>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load your sorting buckets right now.
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.result.buckets}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No sorting-bucket sessions yet."
          />
          <Pagination pagination={data?.pagination} onPageChange={setPage} isLoading={isFetching} />
        </>
      )}

      <OpenBucketDialog open={openDialog} onOpenChange={setOpenDialog} />
    </div>
  );
}

function OpenBucketDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: isNightShift } = useShiftType();
  const [operationType, setOperationType] = useState<"day" | "night">("day");
  const [sortingCenterId, setSortingCenterId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const mutation = useOpenSortingBucket();

  const { data: sections, isLoading: sectionsLoading } = useSortingBucketOptions(
    sortingCenterId || null
  );
  const sectionOptions = useMemo(
    () => (sections ?? []).map((s) => ({ value: String(s.id), label: s.name })),
    [sections]
  );

  const submit = () => {
    const centerId = Number(sortingCenterId);
    const sectionIdNum = Number(sectionId);
    if (!centerId || !sectionIdNum) {
      toast.error("Enter a sorting center id and select a section");
      return;
    }
    const payload: OpenSortingBucketPayload = {
      operation_type: operationType,
      sorting_center_id: centerId,
      sorting_section_id: sectionIdNum,
    };
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Bucket opened");
        onOpenChange(false);
      },
      onError: (error) => toast.error(getErrorMessage(error, "Could not open bucket")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open a sorting bucket</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {isNightShift
              ? "The night shift is currently active."
              : "The day shift is currently active."}{" "}
            A staff member can only have one bucket open at a time.
          </p>
          <div>
            <Label className="mb-1.5 block">Operation type</Label>
            <Select value={operationType} onValueChange={(v) => setOperationType(v as "day" | "night")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Sorting center ID</Label>
            <Input
              type="number"
              value={sortingCenterId}
              onChange={(e) => {
                setSortingCenterId(e.target.value);
                setSectionId("");
              }}
              placeholder="e.g. 1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              No lookup list exists for sorting centers on the backend yet — enter the numeric
              id directly (ask a supervisor if unsure).
            </p>
          </div>
          <div>
            <Label className="mb-1.5 block">Section</Label>
            <Combobox
              options={sectionOptions}
              value={sectionId}
              onChange={setSectionId}
              placeholder={
                !sortingCenterId
                  ? "Enter a sorting center id first"
                  : sectionsLoading
                    ? "Loading…"
                    : "Select section"
              }
              searchPlaceholder="Search…"
              emptyMessage="No sections found for that center."
              disabled={!sortingCenterId || sectionsLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Open bucket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
