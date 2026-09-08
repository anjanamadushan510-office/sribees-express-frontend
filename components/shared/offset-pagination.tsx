"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Page } from "@/types/api";

interface OffsetPaginationProps {
  page: Page<unknown> | undefined;
  onOffsetChange: (offset: number) => void;
  isLoading?: boolean;
}

/**
 * Next/previous paging for endpoints that return a bare array.
 *
 * The API sends no total count, so there is deliberately no "page 3 of 12" and
 * no last-page jump — both would require a number nobody has. `hasMore` is
 * inferred from the page coming back full, which is why "Next" can occasionally
 * lead to an empty page when the row count is an exact multiple of the limit.
 * That is a smaller lie than inventing a total.
 */
export function OffsetPagination({
  page,
  onOffsetChange,
  isLoading,
}: OffsetPaginationProps) {
  if (!page) return null;

  const { items, hasMore, limit, offset } = page;
  const first = items.length === 0 ? 0 : offset + 1;
  const last = offset + items.length;

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {items.length === 0 ? (
          "No results"
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{first}</span>–
            <span className="font-medium text-foreground">{last}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offset === 0 || isLoading}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore || isLoading}
          onClick={() => onOffsetChange(offset + limit)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
