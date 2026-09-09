"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, logout as apiLogout } from "@/lib/api/auth";
import { loadSession, subscribeToStorage } from "@/lib/auth/session";
import type { GuardType, LoginCredentials, Session } from "@/types/auth";

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (guard: GuardType, credentials: LoginCredentials) => Promise<Session>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Module-level so their identity is stable across renders. Inline arrows here
// would make useSyncExternalStore tear down and resubscribe every render.
const notLoadingSnapshot = () => false;
const loadingServerSnapshot = () => true;
const noSessionServerSnapshot = () => null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // The stored session lives in localStorage, which the server cannot read.
  // `useSyncExternalStore` is the hydration-safe way to surface that: the
  // server renders the signed-out snapshot, and the client swaps in the real
  // one during hydration rather than through an extra setState-in-effect pass.
  const stored = useSyncExternalStore(subscribeToStorage, loadSession, noSessionServerSnapshot);

  // A local override so login/logout update instantly without waiting for a
  // storage event (which the writing tab never receives).
  const [override, setOverride] = useState<Session | null | undefined>(undefined);
  const session = override === undefined ? stored : override;

  // Only the very first client render is "loading"; after hydration the
  // localStorage answer is known synchronously.
  const isLoading = useSyncExternalStore(
    subscribeToStorage,
    notLoadingSnapshot,
    loadingServerSnapshot
  );

  const setSession = setOverride;

  const login = useCallback(
    async (guard: GuardType, credentials: LoginCredentials) => {
      const next = await apiLogin(guard, credentials);
      setSession(next);
      return next;
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    const guard = session?.guard ?? "client";
    // Staff logout revokes the refresh token server-side, so it is awaited —
    // clearing locally while the token stays valid on the server is not a
    // logout, it is just hiding the session from this browser.
    await apiLogout(guard);
    setSession(null);
    router.push(guard === "staff" ? "/admin/login" : "/login");
  }, [router, session?.guard, setSession]);

  const hasRole = useCallback(
    (role: string) => session?.roles.includes(role) ?? false,
    [session]
  );

  /**
   * Permission checks are NOT enforced client-side, and deliberately so.
   *
   * This backend exposes roles but no permission list, so there is no data to
   * answer `hasPermission("approve-expense")` with. Both alternatives are
   * worse than deferring: returning `false` hides every admin action and makes
   * the app look broken, while pretending to check something we cannot see
   * dresses UX up as security.
   *
   * So this returns true and lets the API's 403 be the authority — which it
   * always was. When the backend grows a permissions claim, read it here and
   * this becomes a real check without touching a single call site.
   */
  const hasPermission = useCallback<(permission: string) => boolean>(() => true, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      isLoading,
      login,
      logout,
      hasRole,
      hasPermission,
    }),
    [session, isLoading, login, logout, hasRole, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
