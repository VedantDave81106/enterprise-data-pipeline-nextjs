import { NextRequest, NextResponse } from "next/server";

export interface SessionContext {
  userId: string;
  email: string;
  role: "ADMIN" | "MEMBER" | "GUEST";
  organizationId?: string;
  source: "COOKIE" | "BEARER_TOKEN" | "SIMULATED_TEST_HEADER";
}

/**
 * Parses session from Next.js Edge/Node request headers and cookies.
 * Supports standard Better Auth cookies, Bearer tokens, and development testing headers.
 */
export async function parseSessionFromRequest(req: NextRequest): Promise<SessionContext | null> {
  // 1. Check for Simulation / Test header (used by testing suite and interactive RBAC simulator)
  const testRole = req.headers.get("x-simulated-role")?.toUpperCase();
  const testUserId = req.headers.get("x-simulated-user-id");
  const testOrgId = req.headers.get("x-simulated-org-id");

  if (testRole && ["ADMIN", "MEMBER", "GUEST"].includes(testRole)) {
    return {
      userId: testUserId || `sim_${testRole.toLowerCase()}_001`,
      email: `${testRole.toLowerCase()}@enterprise.demo`,
      role: testRole as "ADMIN" | "MEMBER" | "GUEST",
      organizationId: testOrgId || "org_demo_acme",
      source: "SIMULATED_TEST_HEADER",
    };
  }

  // 2. Check for Authorization header (Bearer Token)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    // Decode demo/jwt token format if matching token pattern
    if (token.startsWith("token_admin_")) {
      return {
        userId: "admin_user_001",
        email: "admin@enterprise.demo",
        role: "ADMIN",
        organizationId: "org_demo_acme",
        source: "BEARER_TOKEN",
      };
    }
    if (token.startsWith("token_member_")) {
      return {
        userId: "member_user_002",
        email: "alice.member@enterprise.demo",
        role: "MEMBER",
        organizationId: "org_demo_acme",
        source: "BEARER_TOKEN",
      };
    }
    if (token.startsWith("token_guest_")) {
      return {
        userId: "guest_user_003",
        email: "carlos.guest@enterprise.demo",
        role: "GUEST",
        organizationId: "org_demo_fintech",
        source: "BEARER_TOKEN",
      };
    }
  }

  // 3. Check for Better Auth Session Cookie
  const sessionCookie =
    req.cookies.get("better-auth.session_token")?.value ||
    req.cookies.get("__Secure-better-auth.session_token")?.value;

  if (sessionCookie) {
    // In production, queries Better Auth session endpoint
    try {
      const authUrl = process.env.BETTER_AUTH_URL || req.nextUrl.origin;
      const res = await fetch(`${authUrl}/api/auth/get-session`, {
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.user && data?.session) {
          return {
            userId: data.user.id,
            email: data.user.email,
            role: (data.user.role as any) || "MEMBER",
            organizationId: data.user.organizationId,
            source: "COOKIE",
          };
        }
      }
    } catch {
      // Fallback if backend server is still initializing
    }
  }

  return null;
}

/**
 * Validates role-based access control requirements against an active session.
 */
export function validateRbac(
  session: SessionContext | null,
  requiredRole: "ADMIN" | "MEMBER" | "GUEST"
): { allowed: boolean; status: number; reason?: string } {
  if (!session) {
    return {
      allowed: false,
      status: 401,
      reason: "Authentication Required: Active session token or cookie was not found.",
    };
  }

  // Role Hierarchy: ADMIN > MEMBER > GUEST
  const hierarchy: Record<string, number> = {
    ADMIN: 3,
    MEMBER: 2,
    GUEST: 1,
  };

  const userLevel = hierarchy[session.role] ?? 0;
  const requiredLevel = hierarchy[requiredRole] ?? 0;

  if (userLevel < requiredLevel) {
    return {
      allowed: false,
      status: 403,
      reason: `Forbidden: Endpoint requires ${requiredRole} privileges, but active session possesses ${session.role} role.`,
    };
  }

  return { allowed: true, status: 200 };
}
