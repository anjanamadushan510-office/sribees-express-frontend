"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { getErrorMessage } from "@/lib/api/client";
import type { GuardType } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Module-level for a stable identity — see the note in providers/auth-provider.tsx.
const noopSubscribe = () => () => {};
const isHydrated = () => true;
const notHydrated = () => false;

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  // A copy-pasted password commonly carries a leading/trailing space or
  // newline picked up with the selection; trimming only the ends (never
  // interior characters) before it reaches the API is standard practice
  // (Google, GitHub, etc. do the same) and can't silently accept a wrong
  // password since the account's real password is compared post-trim too.
  password: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "Password is required")),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm({
  guard,
  redirectTo,
}: {
  guard: GuardType;
  redirectTo: string;
}) {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // False during SSR and the first client render, true once React has taken
  // over. Gating submit on it means the button cannot fire a native, unhandled
  // submit in the window before hydration.
  const hydrated = useSyncExternalStore(noopSubscribe, isHydrated, notHydrated);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const session = await login(guard, values);
      toast.success(`Welcome back${session.user.name ? `, ${session.user.name}` : ""}`);
      // The password-expiry warning is gone: this backend has no expiry claim,
      // and a warning that can never fire is just dead code pretending to be a
      // policy. See docs/API-GAPS.md.
      router.push(redirectTo);
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid email or password"));
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      // POST, not the default GET. Before React hydrates, `onSubmit` is not
      // attached yet, so pressing Enter performs a NATIVE submit — and a
      // native GET puts the password in the query string, where it lands in
      // the address bar, browser history, and every proxy and access log on
      // the way. `method="post"` makes that stray submit a body instead, and
      // the disabled button below keeps it from happening at all.
      method="post"
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || !hydrated}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
