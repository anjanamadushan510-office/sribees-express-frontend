import type { Metadata } from "next";
import { LoginPageView } from "@/components/auth/login-page-view";

export const metadata: Metadata = {
  title: "Staff Login — SRIBEES Express",
};

export default function StaffLoginPage() {
  return <LoginPageView guard="staff" redirectTo="/admin/dashboard" />;
}

