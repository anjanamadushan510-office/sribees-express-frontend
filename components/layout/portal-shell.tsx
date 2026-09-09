"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Globe, LogOut, Sun, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  adminNavSections,
  customerNavSections,
  flattenNav,
  type NavSection,
} from "@/lib/nav";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PortalShellProps {
  variant: "customer" | "admin";
  portalLabel: string;
  children: React.ReactNode;
}

export function PortalShell({ variant, portalLabel, children }: PortalShellProps) {
  const sections = variant === "admin" ? adminNavSections : customerNavSections;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = flattenNav(sections)
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const pageTitle = current?.label ?? portalLabel;

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.97_0.005_285)]">
      {/* Full-width brand header */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 bg-gradient-to-r from-brand-from to-brand-to px-4 text-white shadow-md">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/15 lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>

        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
            <Globe className="size-5" />
          </span>
          <span className="leading-none">
            <span className="block text-base font-bold tracking-tight">
              SRIBEES Express
            </span>
            <span className="block text-[11px] font-medium text-white/80">
              {portalLabel}
            </span>
          </span>
        </Link>

        <div className="mx-2 hidden h-8 w-px bg-white/25 sm:block" />
        <span className="hidden text-lg font-semibold sm:block">{pageTitle}</span>

        <div className="flex-1" />
        <GreetingPill />
        <UserMenu />
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-background lg:flex">
          <SidebarBody sections={sections} pathname={pathname} />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarBody
              sections={sections}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarBody({
  sections,
  pathname,
  onNavigate,
}: {
  sections: NavSection[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Download-the-app promo card */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-brand-from to-brand-to p-3 text-white">
          <Smartphone className="size-7 shrink-0" />
          <div className="leading-tight">
            <p className="text-sm font-semibold">Download the app</p>
            <p className="text-[11px] text-white/80">Manage orders on the go</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 px-3 pb-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (!item.href.endsWith("/dashboard") &&
                    pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

const noopSubscribe = () => () => {};
const neutralGreeting = () => "Hello";

/** Time-of-day greeting. Depends on the viewer's clock, which the server does
 *  not have, so it renders neutrally on the server and refines after mount. */
function greetingForNow(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
}

function GreetingPill() {
  const { session } = useAuth();
  // useSyncExternalStore with a never-changing subscription: the server
  // snapshot is the neutral "Hello", the client snapshot reads the clock. This
  // is the hydration-safe way to render browser-only state — an effect that
  // calls setState on mount does the same thing via an extra render pass.
  const greeting = useSyncExternalStore(noopSubscribe, greetingForNow, neutralGreeting);

  const name = session?.user.name ?? session?.user.email ?? "there";

  return (
    <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 text-foreground shadow-sm sm:flex">
      <Sun className="size-5 text-amber-500" />
      <span className="leading-tight">
        <span className="block text-[11px] text-muted-foreground">{greeting}</span>
        <span className="block max-w-[140px] truncate text-sm font-semibold">
          {name}
        </span>
      </span>
      <span className="size-2 rounded-full bg-emerald-500" />
    </div>
  );
}

function UserMenu() {
  const { session, logout } = useAuth();
  const name = session?.user.name ?? session?.user.email ?? "Account";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative" aria-label="Account menu">
          <Avatar className="size-9 border-2 border-white/40">
            <AvatarFallback className="bg-white/20 text-sm font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-[oklch(0.6_0.22_27)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>{name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {session?.user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} className="text-destructive">
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
