"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import type { GuardType } from "@/types/auth";

/**
 * Client-side gate that complements the `proxy.ts` redirect.
 * Ensures the rehydrated session matches the required guard before rendering.
 */
export function AuthGuard({
  guard,
  loginPath,
  children,
}: {
  guard: GuardType;
  loginPath: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!session || session.guard !== guard) {
      router.replace(loginPath);
    }
  }, [isLoading, session, guard, loginPath, router]);

  if (isLoading || !session || session.guard !== guard) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
