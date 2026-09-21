import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { connectMongoose, inMemoryDocumentStore } from "@/lib/mongoose";
import { RawWebhookEvent } from "@/models/RawWebhookEvent";

/**
 * Resend Webhook Ingestion & Hybrid Data Dispatch Route Handler (Part C & CO4)
 * Ingests webhook delivery/bounce events into Prisma (Relational) AND Mongoose (Object DB).
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // Standard Resend webhook event structure
    const eventType = rawBody.type || "email.delivered";
    const emailData = rawBody.data || {};
    const resendEmailId = emailData.email_id || emailData.id || `re_unknown_${Date.now()}`;
    const recipientEmail = Array.isArray(emailData.to) ? emailData.to[0] : (emailData.to || "unknown@domain.com");

    console.log(`\n🔔 [Webhook Ingested] Resend Event: ${eventType} | ID: ${resendEmailId}`);

    // 1. RELATIONAL PERSISTENCE (Prisma ORM)
    // Update or upsert EmailDispatchLog
    let relationalLog = await prisma.emailDispatchLog.findUnique({
      where: { resendEmailId },
    });

    if (relationalLog) {
      relationalLog = await prisma.emailDispatchLog.update({
        where: { resendEmailId },
        data: {
          eventType: eventType.replace("email.", "").toUpperCase(),
          status: eventType.includes("bounced") ? "BOUNCED" : "DELIVERED",
          deliveredAt: eventType.includes("delivered") ? new Date() : relationalLog.deliveredAt,
          bouncedAt: eventType.includes("bounced") ? new Date() : relationalLog.bouncedAt,
          metadata: JSON.stringify({
            lastWebhookPayload: rawBody,
            processedTimestamp: new Date().toISOString(),
          }),
        },
      });
    } else {
      relationalLog = await prisma.emailDispatchLog.create({
        data: {
          resendEmailId,
          recipientEmail,
          subject: emailData.subject || "Transactional Event Notification",
          eventType: eventType.replace("email.", "").toUpperCase(),
          status: eventType.includes("bounced") ? "BOUNCED" : "DELIVERED",
          deliveredAt: eventType.includes("delivered") ? new Date() : null,
          bouncedAt: eventType.includes("bounced") ? new Date() : null,
          metadata: JSON.stringify(rawBody),
        },
      });
    }

    // Record an immutable relational AuditLog
    const auditRecord = await prisma.auditLog.create({
      data: {
        action: `WEBHOOK_${eventType.toUpperCase().replace(".", "_")}`,
        resource: "ResendWebhook",
        details: JSON.stringify({
          resendEmailId,
          eventType,
          recipientEmail,
        }),
      },
    });

    // 2. OBJECT DATABASE PERSISTENCE (Mongoose ODM - CO4)
    let mongooseResult: any = null;
    try {
      const { isConnected } = await connectMongoose();
      if (isConnected) {
        const doc = await RawWebhookEvent.create({
          eventId: resendEmailId,
          provider: "Resend",
          type: eventType,
          rawPayload: rawBody,
          status: "INGESTED_PERSISTED_MONGOOSE",
        });
        mongooseResult = { storedIn: "MongoDB", docId: doc._id };
      } else {
        // In-memory fallback
        inMemoryDocumentStore.push({
          _id: `mem_${Date.now()}`,
          provider: "Resend",
          type: eventType,
          rawPayload: rawBody,
          createdAt: new Date(),
        });
        mongooseResult = { storedIn: "Mongoose InMemoryDocumentStore (Local Mode)" };
      }
    } catch (mErr: any) {
      console.warn("Mongoose telemetry ingestion warning:", mErr.message);
      mongooseResult = { storedIn: "Fallback Store", warning: mErr.message };
    }

    return NextResponse.json(
      {
        success: true,
        message: "Webhook processed and persisted across relational & object datastores.",
        relationalStore: {
          orm: "Prisma",
          emailDispatchLogId: relationalLog.id,
          auditLogId: auditRecord.id,
          newStatus: relationalLog.status,
        },
        objectStore: {
          odm: "Mongoose",
          telemetry: mongooseResult,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook payload", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Inspection Endpoint to retrieve recent webhook logs across Prisma and Mongoose
 */
export async function GET() {
  try {
    const relationalLogs = await prisma.emailDispatchLog.findMany({
      take: 20,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: relationalLogs.length,
      prismaRelationalLogs: relationalLogs,
      mongooseDocumentLogsCount: inMemoryDocumentStore.length,
      mongooseRecentDocuments: inMemoryDocumentStore.slice(-10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
