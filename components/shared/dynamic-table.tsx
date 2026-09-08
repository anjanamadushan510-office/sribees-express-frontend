import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

/**
 * Renders a table whose columns are derived from whatever keys the first row
 * happens to have — used for bespoke report endpoints whose row shape varies
 * per report and isn't worth a dedicated column config. Values that are
 * themselves objects/arrays are JSON-stringified rather than crashing React.
 */
export function DynamicTable({
  rows,
  isLoading,
  maxRows = 200,
  emptyMessage = "No rows for this filter.",
  rowActions,
}: {
  rows: Record<string, unknown>[] | undefined;
  isLoading?: boolean;
  maxRows?: number;
  emptyMessage?: string;
  rowActions?: (row: Record<string, unknown>) => ReactNode;
}) {
  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const safeRows = rows ?? [];
  if (safeRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border py-16 text-muted-foreground">
        <Inbox className="size-6" />
        <span className="text-sm">{emptyMessage}</span>
      </div>
    );
  }

  const columns = Object.keys(safeRows[0]);

  return (
    <div className="max-h-[60vh] overflow-auto rounded-md border">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-2 py-1.5 font-medium">
                {c}
              </th>
            ))}
            {rowActions && <th className="px-2 py-1.5" />}
          </tr>
        </thead>
        <tbody>
          {safeRows.slice(0, maxRows).map((row, i) => (
            <tr key={i} className="border-t">
              {columns.map((c) => (
                <td key={c} className="whitespace-nowrap px-2 py-1.5">
                  {formatCell(row[c])}
                </td>
              ))}
              {rowActions && <td className="px-2 py-1.5 text-right">{rowActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {safeRows.length > maxRows && (
        <p className="p-2 text-xs text-muted-foreground">
          Showing first {maxRows} of {safeRows.length} rows.
        </p>
      )}
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
