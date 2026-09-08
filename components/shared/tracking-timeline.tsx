import { CheckCircle2, Circle } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { TrackingStatusEntry } from "@/types/tracking";

/**
 * Vertical timeline of an order's status history.
 * The most recent entry (first in the list) is highlighted as the current step.
 */
export function TrackingTimeline({ history }: { history: TrackingStatusEntry[] }) {
  if (!history?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No tracking history available yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-6">
      {history.map((entry, idx) => {
        const isCurrent = idx === 0;
        return (
          <li key={`${entry.name}-${entry.added_date}-${idx}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              {isCurrent ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <Circle className="size-5 text-muted-foreground" />
              )}
              {idx < history.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
              )}
            </div>
            <div className="-mt-0.5 pb-2">
              <p
                className={
                  isCurrent ? "font-semibold" : "font-medium text-foreground/90"
                }
              >
                {entry.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(entry.added_date)}
              </p>
              {entry.remarks && (
                <p className="mt-1 text-sm text-muted-foreground">{entry.remarks}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
