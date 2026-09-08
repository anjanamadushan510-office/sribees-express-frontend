import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Customer Login — SRIBEES Express",
};

export default function CustomerLoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Customer Login</CardTitle>
        <CardDescription>
          Sign in to manage your shipments and track deliveries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm guard="client" redirectTo="/dashboard" />
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 text-sm text-muted-foreground">
        <Link href="/track" className="hover:text-foreground">
          Track a package without signing in →
        </Link>
        <Link href="/admin/login" className="hover:text-foreground">
          Staff member? Use the staff portal →
        </Link>
      </CardFooter>
    </Card>
  );
}
