import type { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PortalShell } from "@/components/layout/portal-shell";

export default function AdminPortalLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard guard="staff" loginPath="/admin/login">
      <PortalShell variant="admin" portalLabel="- Staff Portal -">
        {children}
      </PortalShell>
    </AuthGuard>
  );
}
