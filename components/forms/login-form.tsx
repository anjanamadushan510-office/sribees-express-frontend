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
  const [rememberMe, setRememberMe] = useState(true);

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
      router.push(redirectTo);
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid email or password"));
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      method="post"
      className="space-y-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="demo@sribees.lk"
          className="h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-slate-900 dark:text-slate-100 shadow-xs transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter Password"
            className="h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-3.5 pr-10 text-slate-900 dark:text-slate-100 shadow-xs transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs font-medium text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <label htmlFor="remember" className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="size-4 rounded border-slate-300 accent-primary text-primary focus:ring-primary cursor-pointer"
          />
          <span>Remember Me</span>
        </label>
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        disabled={isSubmitting || !hydrated}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          "Login"
        )}
      </Button>
    </form>
  );
}

