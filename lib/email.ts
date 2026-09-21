import { Resend } from "resend";
import { render } from "@react-email/render";
import { TransactionAlertEmail } from "@/emails/TransactionAlertEmail";
import { prisma } from "@/lib/prisma";

const resendApiKey = process.env.RESEND_API_KEY || "re_mock_key";
const resend = new Resend(resendApiKey);

export interface TransactionNotificationPayload {
  transactionId: string;
  referenceCode: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  recipientEmail: string;
  recipientName?: string;
  organizationId: string;
  organizationName: string;
}

export interface EmailDispatchResult {
  success: boolean;
  emailId?: string;
  mode: "LIVE_RESEND_API" | "SIMULATED_MOCK_DISPATCH";
  error?: string;
}

/**
 * Dispatches transactional notifications via Resend & React Email following a Prisma database mutation.
 * Persists dispatch telemetry in Prisma EmailDispatchLog and AuditLog.
 */
export async function sendTransactionAlertNotification(
  payload: TransactionNotificationPayload
): Promise<EmailDispatchResult> {
  const isMock =
    !process.env.RESEND_API_KEY ||
    process.env.RESEND_API_KEY.includes("mock") ||
    process.env.RESEND_API_KEY.startsWith("re_mock");

  const emailSubject = `Security Alert: Transaction #${payload.referenceCode} Confirmed ($${payload.amount.toFixed(2)})`;

  try {
    // 1. Render React Email component to standards-compliant HTML string
    const emailHtml = await render(
      TransactionAlertEmail({
        recipientName: payload.recipientName || "Valued Member",
        referenceCode: payload.referenceCode,
        amount: payload.amount,
        currency: payload.currency,
        category: payload.category,
        organizationName: payload.organizationName,
        status: payload.status,
        timestamp: new Date().toUTCString(),
      })
    );

    let resendEmailId: string;

    if (!isMock) {
      // 2. Dispatch through active Resend API
      const dispatchResponse = await resend.emails.send({
        from: process.env.EMAIL_FROM || "Finance Security <alerts@resend.dev>",
        to: [payload.recipientEmail],
        subject: emailSubject,
        html: emailHtml,
      });

      if (dispatchResponse.error) {
        throw new Error(`Resend API Error: ${dispatchResponse.error.message}`);
      }

      resendEmailId = dispatchResponse.data?.id || `re_${Date.now()}`;
    } else {
      // Simulated Dispatch Mode (used for evaluation, offline testing, CI/CD)
      resendEmailId = `re_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`📨 [Resend Simulated Dispatch] Alert dispatched to: ${payload.recipientEmail}`);
      console.log(`   Subject: ${emailSubject}`);
      console.log(`   Simulated Resend ID: ${resendEmailId}`);
    }

    // 3. Persist dispatch record in Prisma relational database
    await prisma.emailDispatchLog.create({
      data: {
        resendEmailId,
        recipientEmail: payload.recipientEmail,
        subject: emailSubject,
        eventType: "DISPATCHED",
        status: "SUCCESS",
        metadata: JSON.stringify({
          mode: isMock ? "SIMULATED" : "LIVE_API",
          transactionReference: payload.referenceCode,
          amount: payload.amount,
          organizationId: payload.organizationId,
        }),
      },
    });

    // 4. Record immutable audit log
    await prisma.auditLog.create({
      data: {
        action: "EMAIL_NOTIFICATION_DISPATCHED",
        resource: "TransactionAlertEmail",
        details: JSON.stringify({
          resendEmailId,
          recipient: payload.recipientEmail,
          transactionRef: payload.referenceCode,
          mode: isMock ? "SIMULATED" : "LIVE",
        }),
        organizationId: payload.organizationId,
      },
    });

    return {
      success: true,
      emailId: resendEmailId,
      mode: isMock ? "SIMULATED_MOCK_DISPATCH" : "LIVE_RESEND_API",
    };
  } catch (error: any) {
    console.error("❌ [Email Dispatch Error]:", error.message);

    // Record failure in audit log
    await prisma.auditLog.create({
      data: {
        action: "EMAIL_DISPATCH_FAILED",
        resource: "TransactionAlertEmail",
        details: JSON.stringify({
          error: error.message,
          recipient: payload.recipientEmail,
          transactionRef: payload.referenceCode,
        }),
        organizationId: payload.organizationId,
      },
    });

    return {
      success: false,
      error: error.message,
      mode: isMock ? "SIMULATED_MOCK_DISPATCH" : "LIVE_RESEND_API",
    };
  }
}
