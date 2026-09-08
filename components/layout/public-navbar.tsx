import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <PackageCheck className="size-6 text-primary" />
          <span>SRIBEES Express</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/track">Track</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Customer Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/login">Staff Portal</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
