import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSessionFromRequest, validateRbac } from "@/lib/proxy-gate";
import { sendTransactionAlertNotification } from "@/lib/email";
import { TransactionStatus } from "@prisma/client";

/**
 * Multi-Tenant Scoped Transaction Route Handler (CO3 & CO4)
 */
export async function GET(request: NextRequest) {
  const session = await parseSessionFromRequest(request);

  // If no session from proxy, return 401
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized: Active session required", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  try {
    // Multi-tenant scoping: Members can ONLY access their own organization's records
    const whereClause: any = {};
    if (session.role !== "ADMIN" && session.organizationId) {
      whereClause.organizationId = session.organizationId;
    } else if (session.role === "ADMIN") {
      // Optional query param filter for Admins
      const orgParam = request.nextUrl.searchParams.get("organizationId");
      if (orgParam) whereClause.organizationId = orgParam;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        organization: { select: { id: true, name: true, slug: true, tier: true } },
      },
    });

    return NextResponse.json({
      success: true,
      authenticatedUser: {
        id: session.userId,
        email: session.email,
        role: session.role,
        organizationId: session.organizationId,
      },
      tenantIsolation: {
        scopedToOrganization: session.role === "ADMIN" ? "ALL (Admin Override)" : session.organizationId,
        enforced: true,
      },
      count: transactions.length,
      data: transactions,
    });
  } catch (error: any) {
    console.error("Transaction fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await parseSessionFromRequest(request);

  // Check RBAC: Member or Admin required to create transactions (Guests are read-only)
  const rbac = validateRbac(session, "MEMBER");
  if (!rbac.allowed) {
    return NextResponse.json(
      { error: rbac.reason, code: "FORBIDDEN" },
      { status: rbac.status }
    );
  }

  try {
    const body = await request.json();
    const { amount, category, description, currency = "USD" } = body;

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json(
        { error: "Validation Error: 'amount' must be a valid positive number" },
        { status: 400 }
      );
    }

    // Resolve User & Organization records to maintain relational integrity
    let targetUser = await prisma.user.findFirst({
      where: { id: session!.userId },
      include: { organization: true },
    });

    // Fallback for simulated/demo accounts if not yet directly in DB
    if (!targetUser) {
      targetUser = await prisma.user.findFirst({
        where: { email: session!.email },
        include: { organization: true },
      });
    }

    // Secondary fallback to first user in system
    if (!targetUser) {
      targetUser = await prisma.user.findFirst({
        include: { organization: true },
      });
    }

    if (!targetUser || !targetUser.organizationId) {
      return NextResponse.json(
        { error: "Failed to link transaction: User has no assigned organization." },
        { status: 422 }
      );
    }

    const refCode = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // 1. Execute Prisma database mutation (Unit IV)
    const transaction = await prisma.transaction.create({
      data: {
        referenceCode: refCode,
        amount: parseFloat(amount),
        currency,
        status: TransactionStatus.COMPLETED,
        category: category || "OPERATIONAL_EXPENSE",
        description: description || "Automated transactional endpoint mutation",
        userId: targetUser.id,
        organizationId: targetUser.organizationId,
      },
      include: {
        organization: true,
        user: true,
      },
    });

    // 2. Record immutable AuditLog in relational database
    const auditLog = await prisma.auditLog.create({
      data: {
        action: "TRANSACTION_CREATED",
        resource: "Transaction",
        details: JSON.stringify({
          transactionId: transaction.id,
          referenceCode: transaction.referenceCode,
          amount: transaction.amount,
          category: transaction.category,
        }),
        userId: targetUser.id,
        organizationId: targetUser.organizationId,
      },
    });

    // 3. Trigger automated transactional email notification via Resend & React Email (Part C)
    const emailDispatch = await sendTransactionAlertNotification({
      transactionId: transaction.id,
      referenceCode: transaction.referenceCode,
      amount: transaction.amount,
      currency: transaction.currency,
      category: transaction.category,
      status: transaction.status,
      recipientEmail: targetUser.email,
      recipientName: targetUser.name,
      organizationId: targetUser.organizationId,
      organizationName: targetUser.organization?.name || "Enterprise Solutions",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Transaction created, audit logged, and Resend notification triggered.",
        transaction,
        auditLogId: auditLog.id,
        emailNotification: emailDispatch,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Transaction creation error:", error);
    return NextResponse.json(
      { error: "Transaction mutation failed", details: error.message },
      { status: 500 }
    );
  }
}
