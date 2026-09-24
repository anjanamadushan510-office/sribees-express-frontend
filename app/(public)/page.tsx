import type { Metadata } from "next";
import { LoginPageView } from "@/components/auth/login-page-view";

export const metadata: Metadata = {
  title: "Staff Login — SRIBEES Express",
  description: "SRIBEES Express Staff & Branch Portal Login",
};

export default function LandingPage() {
  return <LoginPageView guard="staff" redirectTo="/admin/dashboard" />;
}

