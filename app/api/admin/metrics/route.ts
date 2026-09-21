import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSessionFromRequest, validateRbac } from "@/lib/proxy-gate";

export async function GET(request: NextRequest) {
  // Defense-in-depth: Validate session and ADMIN role directly within Route Handler
  const roleHeader = request.headers.get("x-user-role");
  let isAdmin = roleHeader === "ADMIN";

  if (!isAdmin) {
    const session = await parseSessionFromRequest(request);
    const rbac = validateRbac(session, "ADMIN");
    if (!rbac.allowed) {
      return NextResponse.json(
        {
          error: rbac.reason,
          code: "FORBIDDEN",
          requiredRole: "ADMIN",
          currentRole: session?.role || "NONE",
        },
        { status: rbac.status }
      );
    }
    isAdmin = true;
  }

  try {
    // 1. Relational aggregation queries via Prisma ORM
    const [
      totalUsers,
      usersByRole,
      totalOrgs,
      transactionAggregates,
      recentAuditLogs,
      emailDispatchCounts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.organization.count(),
      prisma.transaction.aggregate({
        _count: { id: true },
        _sum: { amount: true },
        _avg: { amount: true },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true, role: true } },
          organization: { select: { name: true, slug: true } },
        },
      }),
      prisma.emailDispatchLog.groupBy({
        by: ["eventType"],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      gateCheck: {
        enforcedBy: "Next.js Edge Middleware Proxy + Route Handler RBAC Gate",
        authorizedRole: "ADMIN",
      },
      metrics: {
        users: {
          total: totalUsers,
          distribution: usersByRole.reduce((acc, curr) => {
            acc[curr.role] = curr._count.id;
            return acc;
          }, {} as Record<string, number>),
        },
        organizations: {
          total: totalOrgs,
        },
        transactions: {
          totalCount: transactionAggregates._count.id,
          grossVolume: transactionAggregates._sum.amount || 0,
          averageTicket: transactionAggregates._avg.amount || 0,
        },
        emailTelemetry: emailDispatchCounts.reduce((acc, curr) => {
          acc[curr.eventType] = curr._count.id;
          return acc;
        }, {} as Record<string, number>),
        recentAudits: recentAuditLogs,
      },
    });
  } catch (error: any) {
    console.error("Admin metrics error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve administrative metrics", details: error.message },
      { status: 500 }
    );
  }
}
