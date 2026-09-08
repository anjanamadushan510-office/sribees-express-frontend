import type { ReactNode } from "react";
import Link from "next/link";
import { PackageCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <PackageCheck className="size-7 text-primary" />
        SRIBEES Express
      </Link>
      {children}
    </div>
  );
}
