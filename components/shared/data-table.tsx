import { Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Column<T> {
  /** Header label. */
  header: string;
  /** Cell renderer. */
  cell: (row: T) => React.ReactNode;
  /** Optional className applied to the cell + header. */
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  isLoading?: boolean;
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  rowKey,
  onRowClick,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, r) => (
              <TableRow key={r}>
                {columns.map((_, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !rows || rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Inbox className="size-6" />
                  <span className="text-sm">{emptyMessage}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((col, i) => (
                  <TableCell key={i} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
