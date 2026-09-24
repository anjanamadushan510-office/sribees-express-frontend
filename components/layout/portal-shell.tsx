"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LogOut,
  Sun,
  Moon,
  Smartphone,
  PackageCheck,
  Search,
  Bell,
  ChevronRight,
  User,
} from "lucide-react";
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
  const pageTitle = current?.label ?? portalLabel.replace(/^-\s*|\s*-$/g, "").trim();
  const cleanPortalLabel = portalLabel.replace(/^-\s*|\s*-$/g, "").trim();

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.97_0.005_285)]">
      {/* High-clarity modern brand header */}
      <header className="sticky top-0 z-40 flex flex-col w-full bg-background/95 backdrop-blur-md border-b border-border/80 shadow-2xs">
        {/* Top brand accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-brand-from via-primary to-rose-400" />

        <div className="flex h-15 items-center justify-between gap-3 px-4 sm:px-6">
          {/* Left section: Mobile toggle + Brand logo & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>

            <Link href="/" className="flex items-center gap-2.5 group transition-opacity hover:opacity-90">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-from to-brand-to text-white shadow-xs ring-1 ring-black/10">
                <PackageCheck className="size-5" />
              </span>
              <div className="leading-none">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    SRIBEES Express
                  </span>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
                    {cleanPortalLabel}
                  </span>
                </div>
              </div>
            </Link>

            <ChevronRight className="hidden md:block size-4 text-muted-foreground/40 shrink-0" />
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground/90">{pageTitle}</span>
            </div>
          </div>

          {/* Center section: Quick search trigger */}
{/*           <div className="hidden lg:flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-muted hover:border-border/80 w-56 xl:w-64 cursor-pointer">
            <Search className="size-3.5 text-muted-foreground/70" />
            <span className="truncate">Search system...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-4.5 select-none items-center gap-1 rounded border border-border/70 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-2xs">
              ⌘K
            </kbd>
          </div> */}

          {/* Right section: Notifications, Greeting & Profile */}
       <div className="flex items-center gap-2.5 sm:gap-3">
{/*             <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
              aria-label="Notifications"
            >
              <Bell className="size-4.5" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-background" />
            </Button> */}

            <GreetingPill />
            <UserMenu variant={variant} />
          </div> 
        </div>
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
  const greeting = useSyncExternalStore(noopSubscribe, greetingForNow, neutralGreeting);
  const name = session?.user.name ?? session?.user.email ?? "there";
  const hour = typeof window !== "undefined" ? new Date().getHours() : 12;
  const isNight = hour >= 18 || hour < 6;

  return (
    <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-muted/40 hover:bg-muted/70 px-3.5 py-1.5 text-xs text-foreground transition-all sm:flex shadow-2xs">
      {isNight ? (
        <Moon className="size-4 text-indigo-400 shrink-0" />
      ) : (
        <Sun className="size-4 text-amber-500 shrink-0" />
      )}
      <span className="leading-tight flex items-center gap-1.5">
        <span className="text-muted-foreground text-[11px]">{greeting},</span>
        <span className="max-w-[130px] truncate font-semibold text-foreground">
          {name}
        </span>
      </span>
      <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse shrink-0" />
    </div>
  );
}

function UserMenu({ variant }: { variant?: "customer" | "admin" }) {
  const { session, logout } = useAuth();
  const name = session?.user.name ?? session?.user.email ?? "Account";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = session?.roles?.[0]
    ? session.roles[0].toUpperCase().replace("_", " ")
    : variant === "admin"
    ? "STAFF MEMBER"
    : "CLIENT";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative group focus:outline-none" aria-label="Account menu">
          <Avatar className="size-9 ring-2 ring-primary/20 hover:ring-primary/60 transition-all cursor-pointer shadow-xs">
            <AvatarFallback className="bg-gradient-to-br from-brand-from to-brand-to text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1.5 shadow-lg">
        <DropdownMenuLabel className="p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">{name}</p>
            <p className="text-xs leading-none text-muted-foreground font-normal">
              {session?.user.email}
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/profile" className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <span>Profile & Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

