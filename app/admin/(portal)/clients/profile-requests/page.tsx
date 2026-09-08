"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, RotateCcw, Eye } from "lucide-react";
import { useAdminClientProfileRequests } from "@/lib/hooks/use-admin-client-profiles";
import type { AdminClientProfileRequestRow } from "@/types/admin-client-profile";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PER_PAGE = 15;

const columns: Column<AdminClientProfileRequestRow>[] = [
  { header: "Client", cell: (r) => <span className="font-medium">{r.name}</span> },
  { header: "Email", cell: (r) => r.email ?? "—" },
  { header: "Address", cell: (r) => r.address ?? "—" },
  { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { header: "Updated", cell: (r) => formatDate(r.updated_at) },
  {
    header: "",
    cell: (r) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/clients/profile-requests/${r.id}`}>
          <Eye className="size-4" />
          View
        </Link>
      </Button>
    ),
  },
];

export default function AdminClientProfileRequestsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"pending" | "updated">("pending");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const { data, isFetching, isError } = useAdminClientProfileRequests({
    page,
    perPage: PER_PAGE,
    status,
    client_name: appliedSearch || undefined,
  });

  return (
    <>
      <PageHeader
        title="Profile Update Requests"
        description="Client-submitted profile changes awaiting review."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="w-full space-y-1 sm:w-48">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as typeof status);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="updated">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Client</label>
            <Input
              placeholder="Search client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(search.trim());
                  setPage(1);
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAppliedSearch(search.trim());
                setPage(1);
              }}
            >
              <Search className="size-4" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load profile update requests right now. Check your connection and try
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
            emptyMessage="No requests here."
          />
          <Pagination pagination={data?.pagination} onPageChange={setPage} isLoading={isFetching} />
        </>
      )}
    </>
  );
}
