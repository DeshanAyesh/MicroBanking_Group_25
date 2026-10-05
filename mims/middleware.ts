import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/authorization";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Protect API routes
  if (path.startsWith("/api/") && !path.startsWith("/api/auth/login")) {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  // Protect UI routes
  const protectedPaths = ["/admin", "/agent", "/customer", "/customers", "/accounts", "/transactions", "/fixed-deposits", "/reports"];
  const needsAuth = protectedPaths.some(p => path === p || path.startsWith(p + "/"));

  if (needsAuth) {
    const session = getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role Enforcement
    if (path.startsWith("/admin") && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    if (path.startsWith("/customer") && session.role !== "CUSTOMER" && session.role !== "ADMIN" && session.role !== "AGENT") {
       return NextResponse.redirect(new URL("/login", request.url));
    }

    if ((path.startsWith("/agent") || path.startsWith("/customers") || path.startsWith("/accounts") || path.startsWith("/transactions") || path.startsWith("/fixed-deposits")) 
         && session.role !== "AGENT" && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*", "/admin/:path*", "/agent/:path*", "/customer/:path*", "/customers/:path*", "/accounts/:path*", "/transactions/:path*", "/fixed-deposits/:path*", "/reports/:path*"] };

