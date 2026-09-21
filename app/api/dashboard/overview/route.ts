import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inMemoryDocumentStore, connectMongoose } from "@/lib/mongoose";
import { RawWebhookEvent } from "@/models/RawWebhookEvent";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      orgs,
      users,
      transactions,
      auditLogs,
      emailLogs,
    ] = await Promise.all([
      prisma.organization.findMany({ take: 10, orderBy: { createdAt: "desc" } }),
      prisma.user.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { organization: true },
      }),
      prisma.transaction.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { user: true, organization: true },
      }),
      prisma.auditLog.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { user: true, organization: true },
      }),
      prisma.emailDispatchLog.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    let mongooseDocs: any[] = [];
    try {
      const { isConnected } = await connectMongoose();
      if (isConnected) {
        mongooseDocs = await RawWebhookEvent.find().sort({ createdAt: -1 }).limit(10).lean();
      } else {
        mongooseDocs = inMemoryDocumentStore.slice(-10);
      }
    } catch {
      mongooseDocs = inMemoryDocumentStore.slice(-10);
    }

    return NextResponse.json({
      success: true,
      data: {
        organizations: orgs,
        users,
        transactions,
        auditLogs,
        emailLogs,
        mongooseDocs,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
