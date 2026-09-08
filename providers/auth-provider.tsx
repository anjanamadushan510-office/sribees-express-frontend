"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, logout as apiLogout } from "@/lib/api/auth";
import { loadSession } from "@/lib/auth/session";
import type { GuardType, LoginCredentials, Session } from "@/types/auth";

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (guard: GuardType, credentials: LoginCredentials) => Promise<Session>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount (client-only).
  useEffect(() => {
    setSession(loadSession());
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (guard: GuardType, credentials: LoginCredentials) => {
      const next = await apiLogin(guard, credentials);
      setSession(next);
      return next;
    },
    []
  );

  const logout = useCallback(() => {
    const guard = session?.guard;
    apiLogout();
    setSession(null);
    router.push(guard === "staff" ? "/admin/login" : "/login");
  }, [router, session?.guard]);

  const hasPermission = useCallback(
    (permission: string) => session?.permissions.includes(permission) ?? false,
    [session]
  );

  const hasRole = useCallback(
    (role: string) => session?.roles.includes(role) ?? false,
    [session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      isLoading,
      login,
      logout,
      hasPermission,
      hasRole,
    }),
    [session, isLoading, login, logout, hasPermission, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
