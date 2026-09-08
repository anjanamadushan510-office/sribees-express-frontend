import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Maps a free-text courier status name to a colour. The backend status set is
 * large and configurable, so we classify by keyword rather than an exhaustive enum.
 */
function classify(status: string): string {
  const s = status.toLowerCase();
  if (/(deliver|success|complete|received|paid|settled)/.test(s))
    return "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (/(fail|return|cancel|reject|hold|expired)/.test(s))
    return "border-transparent bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
  if (/(transit|pickup|picked|dispatch|out for|sorting|processing|assigned)/.test(s))
    return "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  if (/(pending|new|created|placed|draft)/.test(s))
    return "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300";
  return "border-transparent bg-muted text-muted-foreground";
}

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const label = status?.trim() || "Unknown";
  return <Badge className={cn(classify(label), className)}>{label}</Badge>;
}
