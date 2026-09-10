import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection (Next.js 16 `proxy` convention — formerly `middleware`).
 *
 * Auth state is mirrored into cookies at login (sx_token, sx_guard) so it is
 * visible server-side here. This layer only handles UX redirects — the cookie
 * is never trusted as authorization. The bearer token is enforced by the API
 * on every request, so a forged cookie buys a redirect, not access.
 */

const CUSTOMER_PREFIXES = [
  "/dashboard",
  "/shipments",
  "/pricing",
  "/profile",
  "/pickups",
  "/finances",
  "/print",
  "/waybill-requests",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("sx_token")?.value;
  const guard = request.cookies.get("sx_guard")?.value;

  const isAdminArea = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isCustomerArea = CUSTOMER_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // Admin/staff area
  if (isAdminArea) {
    if (!token || guard !== "staff") {
      return redirectTo(request, "/admin/login", pathname);
    }
  }

  // Customer area
  if (isCustomerArea) {
    if (!token || guard !== "client") {
      return redirectTo(request, "/login", pathname);
    }
  }

  return NextResponse.next();
}

function redirectTo(request: NextRequest, path: string, from: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = `?next=${encodeURIComponent(from)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/shipments/:path*",
    "/pricing/:path*",
    "/profile/:path*",
    "/pickups/:path*",
    "/finances/:path*",
    "/print/:path*",
    "/waybill-requests/:path*",
    "/admin/:path*",
  ],
};
