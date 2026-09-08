import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SRIBEES Express. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link href="/track" className="hover:text-foreground">
            Track a package
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Customer login
          </Link>
          <Link href="/admin/login" className="hover:text-foreground">
            Staff portal
          </Link>
        </nav>
      </div>
    </footer>
  );
}
