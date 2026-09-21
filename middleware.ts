import { NextRequest, NextResponse } from "next/server";
import { parseSessionFromRequest, validateRbac } from "./lib/proxy-gate";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, Next internal files, and public auth endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/" ||
    pathname === "/sign-in" ||
    pathname === "/unauthorized"
  ) {
    return NextResponse.next();
  }

  // 2. Parse active session from cookies, Bearer token, or proxy simulation headers
  const session = await parseSessionFromRequest(request);

  // 3. Evaluate Administrative Gates: /admin/* and /api/admin/*
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const check = validateRbac(session, "ADMIN");
    if (!check.allowed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: check.reason,
            code: check.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN",
            requiredRole: "ADMIN",
            currentRole: session?.role || "NONE",
          },
          { status: check.status }
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // 4. Evaluate Member Protected Gates: /member/* and /api/member/*
  if (pathname.startsWith("/member") || pathname.startsWith("/api/member")) {
    const check = validateRbac(session, "MEMBER");
    if (!check.allowed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: check.reason,
            code: check.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN",
            requiredRole: "MEMBER",
            currentRole: session?.role || "NONE",
          },
          { status: check.status }
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // 5. Evaluate Multi-Tenant Transaction Gate: /api/transactions/*
  if (pathname.startsWith("/api/transactions")) {
    // Skip public test GET if explicitly permitted, otherwise require authenticated session
    const isWebhook = pathname.startsWith("/api/webhooks");
    if (!isWebhook && !session) {
      return NextResponse.json(
        {
          error: "Unauthorized: Active session required to access tenant transactions.",
          code: "UNAUTHENTICATED",
        },
        { status: 401 }
      );
    }
  }

  // 6. Forward downstream with verified proxy-gate identity headers
  const requestHeaders = new Headers(request.headers);
  if (session) {
    requestHeaders.set("x-user-id", session.userId);
    requestHeaders.set("x-user-email", session.email);
    requestHeaders.set("x-user-role", session.role);
    if (session.organizationId) {
      requestHeaders.set("x-organization-id", session.organizationId);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
