import type { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PortalShell } from "@/components/layout/portal-shell";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard guard="client" loginPath="/login">
      <PortalShell variant="customer" portalLabel="- Client Portal -">
        {children}
      </PortalShell>
    </AuthGuard>
  );
}
