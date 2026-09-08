import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pagination as PaginationMeta } from "@/types/api";

interface PaginationProps {
  pagination: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({ pagination, onPageChange, isLoading }: PaginationProps) {
  if (!pagination) return null;
  const { current_page, last_page, total, per_page } = pagination;
  const from = total === 0 ? 0 : (current_page - 1) * per_page + 1;
  const to = Math.min(current_page * per_page, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading || current_page <= 1}
          onClick={() => onPageChange(current_page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {current_page} of {Math.max(last_page, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading || current_page >= last_page}
          onClick={() => onPageChange(current_page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
