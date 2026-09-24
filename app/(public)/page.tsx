import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Staff Login — SRIBEES Express",
  description: "SRIBEES Express Staff & Branch Portal Login",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="mb-8 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
        <ShieldCheck className="size-8 text-primary" />
        <span>SRIBEES Express — Staff Portal</span>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Staff &amp; Branch Login</CardTitle>
          <CardDescription>
            Sign in to manage packages, pickups, drivers, and operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm guard="staff" redirectTo="/admin/dashboard" />
        </CardContent>
      </Card>
    </div>
  );
}
