import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
