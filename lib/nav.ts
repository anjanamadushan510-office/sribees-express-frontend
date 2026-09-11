import type { LucideIcon } from "lucide-react";
import {
  Home,
  PackagePlus,
  ClipboardList,
  PackageSearch,
  Calculator,
  User,
  Boxes,
  Users,
  Building2,
  BarChart3,
  Truck,
  ListChecks,
  Briefcase,
  UserCog,
  ShieldCheck,
  MapPin,
  Wallet,
  Landmark,
  Receipt,
  FileStack,
  CircleCheckBig,
  Bell,
  Package,
  Building,
  Navigation,
  FileSignature,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** Customer portal navigation (auth:client) — grouped to match the reference portal. */
export const customerNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: Home }],
  },
  {
    title: "Orders",
    items: [
      { label: "Add New Order", href: "/shipments/new", icon: PackagePlus },
      { label: "My Orders", href: "/shipments", icon: ClipboardList },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Pickup Operation", href: "/pickups", icon: PackageSearch },
      { label: "Waybill Requests", href: "/waybill-requests", icon: FileSignature },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Finances", href: "/finances", icon: Receipt },
      { label: "Pricing", href: "/pricing", icon: Calculator },
      { label: "Profile", href: "/profile", icon: User },
    ],
  },
];

/** Admin / branch portal navigation (auth:staff). */
export const adminNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: Home }],
  },
  {
    title: "Operations",
    items: [
      { label: "Packages", href: "/admin/packages", icon: Boxes },
      { label: "Pickup Requests", href: "/admin/pickups", icon: Truck },
      { label: "Drivers", href: "/admin/drivers", icon: Users },
      { label: "Manifests", href: "/admin/manifests", icon: FileStack },
      { label: "Order Clearing", href: "/admin/order-clearing", icon: CircleCheckBig },
      { label: "Sorting", href: "/admin/sorting", icon: Package },
      { label: "Mile Operations", href: "/admin/mile-operations", icon: Navigation },
      { label: "HO Operations", href: "/admin/ho-operations", icon: Building },
    ],
  },
  {
    title: "Network",
    items: [
      // Merchant logins used to be their own screen. They are now a tab on the
      // merchant, which is the only place the API can list them from and the
      // only place the question "who can sign in for this business" is asked.
      { label: "Merchants", href: "/admin/clients", icon: Briefcase },
      { label: "Branches", href: "/admin/branches", icon: Building2 },
      { label: "Locations", href: "/admin/locations", icon: MapPin },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Team",
    items: [
      { label: "Staff & Riders", href: "/admin/staff", icon: UserCog },
      { label: "Roles", href: "/admin/roles", icon: ShieldCheck },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Rider Finances", href: "/admin/rider-finances", icon: Wallet },
      { label: "Branch Finances", href: "/admin/branch-finances", icon: Landmark },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Reasons", href: "/admin/settings/reasons", icon: ListChecks },
      { label: "Notifications", href: "/admin/settings/notifications", icon: Bell },
    ],
  },
];

/** Flattened list of items, for active-route + page-title lookups. */
export function flattenNav(sections: NavSection[]): NavItem[] {
  return sections.flatMap((s) => s.items);
}
