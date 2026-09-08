import type { ReactNode } from "react";

/**
 * Passthrough layout for the /admin URL segment.
 * The authenticated shell (sidebar/navbar + guard) lives in the (portal) group
 * so that /admin/login stays outside it.
 */
export default function AdminSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
