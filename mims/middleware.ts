import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/authorization";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedPaths = ["/admin", "/agent", "/customer", "/customers", "/accounts", "/transactions", "/fixed-deposits", "/reports"];
  const needsAuth = protectedPaths.some(p => path === p || path.startsWith(p + "/"));

  /*
    Production rule:
    after SQL-backed login is implemented, enforce role checks here and in every API.
    Keeping API checks server-side is mandatory; middleware is only an additional layer.
  */
  if (needsAuth && !getSessionFromRequest(request)) {
    // UI pages are left browsable during development so the team can build/test the scaffold.
    // API endpoints always enforce authorization.
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/agent/:path*", "/customer/:path*", "/customers/:path*", "/accounts/:path*", "/transactions/:path*", "/fixed-deposits/:path*", "/reports/:path*"] };
