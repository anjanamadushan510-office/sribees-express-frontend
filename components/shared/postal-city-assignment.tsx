"use client";

import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { usePostalCities } from "@/lib/hooks/use-geo";
import type { PostalCity } from "@/types/admin-geo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  assignedCities: PostalCity[] | undefined;
  assignedLoading: boolean;
  isPending: boolean;
  onAdd: (city: PostalCity) => void;
  onRemove: (city: PostalCity) => void;
  emptyMessage?: string;
}

/**
 * Search-and-add postal cities directly — no district step. Shared by the
 * Zone dialog (Locations page) and the Branch dialog: both assign postal
 * cities to something (a zone's price, a branch's coverage) and both do it
 * the same way, searching the 2,111-row national directory server-side
 * rather than preloading it into a picker.
 */
export function PostalCityAssignmentEditor({
  label,
  assignedCities,
  assignedLoading,
  isPending,
  onAdd,
  onRemove,
  emptyMessage = "None yet.",
}: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const results = usePostalCities({ search: search || undefined, limit: 8 });
  const assignedIds = new Set((assignedCities ?? []).map((c) => c.id));

  return (
    <div className="mt-2 border-t pt-4">
      <Label className="mb-2 block">{label}</Label>
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search postal cities to add"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput.trim())}
        />
      </div>
      {search && (
        <div className="mb-3 flex flex-wrap gap-2">
          {results.isFetching && <span className="text-xs text-muted-foreground">Searching…</span>}
          {results.data?.items.length === 0 && (
            <span className="text-xs text-muted-foreground">No postal cities match.</span>
          )}
          {results.data?.items.map((c) => (
            <Button
              key={c.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={assignedIds.has(c.id) || isPending}
              onClick={() => onAdd(c)}
            >
              <Plus className="mr-1 h-3 w-3" />
              {c.name}
              {c.district ? ` (${c.district})` : ""}
            </Button>
          ))}
        </div>
      )}
      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
        {assignedLoading && <span className="text-xs text-muted-foreground">Loading…</span>}
        {!assignedLoading && (assignedCities ?? []).length === 0 && (
          <span className="text-xs text-muted-foreground">{emptyMessage}</span>
        )}
        {(assignedCities ?? []).map((c) => (
          <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
            {c.name}
            <button
              type="button"
              aria-label={`Remove ${c.name}`}
              disabled={isPending}
              onClick={() => onRemove(c)}
              className="rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
