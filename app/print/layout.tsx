import type { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/auth-guard";

/**
 * Print routes deliberately skip `PortalShell` (no sidebar/header) so the
 * page is a clean printable document — still gated by the customer auth
 * guard since these render real invoice/order data.
 */
export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard guard="client" loginPath="/login">
      <div className="mx-auto min-h-screen max-w-4xl bg-background px-4 py-8 print:max-w-none print:p-0">
        {children}
      </div>
    </AuthGuard>
  );
}
