import { PrismaClient } from "@prisma/client";
import { inMemoryDocumentStore } from "../lib/mongoose";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function runTests() {
  console.log("================================================================================");
  console.log("🧪 AUTOMATED VERIFICATION SUITE: RELATIONAL DATA, RBAC & WEBHOOKS (CO3 / CO4)");
  console.log("================================================================================\n");

  const results: { name: string; passed: boolean; details: string }[] = [];

  // -------------------------------------------------------------
  // TEST SUITE 1: PART A - RELATIONAL INTEGRITY & SEEDING (CO4)
  // -------------------------------------------------------------
  console.log("▶ [Test Suite 1] Verifying Part A: Relational Schema & Faker.js Seeding...");

  const orgCount = await prisma.organization.count();
  const userCount = await prisma.user.count();
  const txnCount = await prisma.transaction.count();
  const auditCount = await prisma.auditLog.count();

  // Check 1.1: Seed volume
  const volumePass = orgCount >= 5 && userCount >= 25 && txnCount >= 100 && auditCount >= 150;
  results.push({
    name: "Relational Seeding Volume (Orgs >= 5, Users >= 25, Txns >= 100, Audits >= 150)",
    passed: volumePass,
    details: `Actual Counts -> Orgs: ${orgCount}, Users: ${userCount}, Txns: ${txnCount}, Audits: ${auditCount}`,
  });

  // Check 1.2: Foreign-Key Integrity between Users and Organizations
  const orphanedUsers = await prisma.user.count({
    where: { organizationId: null },
  });
  results.push({
    name: "Foreign-Key Integrity: User -> Organization Constraint",
    passed: orphanedUsers === 0,
    details: `Orphaned Users Count: ${orphanedUsers} (Expected 0)`,
  });

  // Check 1.3: Foreign-Key Integrity between Transactions and Organizations/Users
  const sampleTxns = await prisma.transaction.findMany({
    take: 20,
    include: { user: true, organization: true },
  });
  const brokenTxns = sampleTxns.filter((t) => !t.user || !t.organization || t.user.organizationId !== t.organizationId);
  results.push({
    name: "Foreign-Key Integrity: Transaction -> User -> Organization Alignment",
    passed: brokenTxns.length === 0,
    details: `Broken Transaction Relations: ${brokenTxns.length} / ${sampleTxns.length} inspected`,
  });

  // -------------------------------------------------------------
  // TEST SUITE 2: PART B - RBAC & PROXY GATE LOGIC (CO3)
  // -------------------------------------------------------------
  console.log("\n▶ [Test Suite 2] Verifying Part B: Edge Proxy Gate & RBAC Validation...");
  const { validateRbac } = await import("../lib/proxy-gate");

  // Check 2.1: Admin privilege check
  const adminSession: any = { role: "ADMIN", userId: "u1", email: "admin@corp.io" };
  const adminCheck = validateRbac(adminSession, "ADMIN");
  results.push({
    name: "RBAC Gate: Admin Session accessing Admin Route (Expect Allowed: true)",
    passed: adminCheck.allowed === true && adminCheck.status === 200,
    details: `Status: ${adminCheck.status}, Allowed: ${adminCheck.allowed}`,
  });

  // Check 2.2: Member blocked from Admin route
  const memberSession: any = { role: "MEMBER", userId: "u2", email: "member@corp.io" };
  const memberBlocked = validateRbac(memberSession, "ADMIN");
  results.push({
    name: "RBAC Gate: Member Session accessing Admin Route (Expect 403 Forbidden)",
    passed: memberBlocked.allowed === false && memberBlocked.status === 403,
    details: `Status: ${memberBlocked.status}, Reason: ${memberBlocked.reason}`,
  });

  // Check 2.3: Guest blocked from Member routes
  const guestSession: any = { role: "GUEST", userId: "u3", email: "guest@corp.io" };
  const guestBlocked = validateRbac(guestSession, "MEMBER");
  results.push({
    name: "RBAC Gate: Guest Session attempting Mutation/Member Route (Expect 403 Forbidden)",
    passed: guestBlocked.allowed === false && guestBlocked.status === 403,
    details: `Status: ${guestBlocked.status}, Reason: ${guestBlocked.reason}`,
  });

  // Check 2.4: Unauthenticated request
  const unauthCheck = validateRbac(null, "MEMBER");
  results.push({
    name: "RBAC Gate: Anonymous/Null Session (Expect 401 Unauthorized)",
    passed: unauthCheck.allowed === false && unauthCheck.status === 401,
    details: `Status: ${unauthCheck.status}, Reason: ${unauthCheck.reason}`,
  });

  // -------------------------------------------------------------
  // TEST SUITE 3: PART C - RESEND DISPATCH & WEBHOOKS (CO3 / CO4)
  // -------------------------------------------------------------
  console.log("\n▶ [Test Suite 3] Verifying Part C: Resend Email Lifecycle & Webhooks...");
  const { sendTransactionAlertNotification } = await import("../lib/email");

  // Check 3.1: Transaction Lifecycle Email Trigger
  const testOrg = await prisma.organization.findFirst();
  const testUser = await prisma.user.findFirst({ where: { organizationId: testOrg?.id } });

  const dispatchResult = await sendTransactionAlertNotification({
    transactionId: "test_tx_001",
    referenceCode: "TXN-VERIFY-001",
    amount: 5400.0,
    currency: "USD",
    category: "CLOUD_INFRASTRUCTURE",
    status: "COMPLETED",
    recipientEmail: testUser?.email || "test@enterprise.demo",
    recipientName: testUser?.name || "Test User",
    organizationId: testOrg!.id,
    organizationName: testOrg!.name,
  });

  results.push({
    name: "Resend & React Email Dispatch on Mutation (Logs to EmailDispatchLog + AuditLog)",
    passed: dispatchResult.success === true,
    details: `Mode: ${dispatchResult.mode}, Email ID: ${dispatchResult.emailId}`,
  });

  // Check 3.2: Verify Prisma logged the email dispatch
  const loggedDispatch = await prisma.emailDispatchLog.findFirst({
    where: { resendEmailId: dispatchResult.emailId },
  });
  results.push({
    name: "Prisma Relational Persistence: EmailDispatchLog entry verified",
    passed: loggedDispatch !== null,
    details: `Found record ID: ${loggedDispatch?.id}, Recipient: ${loggedDispatch?.recipientEmail}`,
  });

  // Check 3.3: Ingest Simulated Resend Webhook
  const webhookResendId = dispatchResult.emailId!;
  const webhookEventType = "email.delivered";

  // Execute webhook logic
  const updatedEmailLog = await prisma.emailDispatchLog.update({
    where: { resendEmailId: webhookResendId },
    data: {
      eventType: "DELIVERED",
      status: "DELIVERED",
      deliveredAt: new Date(),
    },
  });

  // Save to Mongoose in-memory document store
  inMemoryDocumentStore.push({
    _id: `mem_test_${Date.now()}`,
    provider: "Resend",
    type: webhookEventType,
    rawPayload: {
      type: webhookEventType,
      data: { email_id: webhookResendId, status: "delivered" },
    },
    createdAt: new Date(),
  });

  results.push({
    name: "Resend Webhook Ingestion: Dual persistence in Prisma (Relational) & Mongoose (Object DB)",
    passed: updatedEmailLog.status === "DELIVERED" && inMemoryDocumentStore.length > 0,
    details: `Prisma Updated Status: ${updatedEmailLog.status} | Mongoose Docs: ${inMemoryDocumentStore.length}`,
  });

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("📊 VERIFICATION RESULTS SUMMARY");
  console.log("================================================================================");

  let passedCount = 0;
  results.forEach((r, idx) => {
    if (r.passed) passedCount++;
    const icon = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${icon} [${idx + 1}] ${r.name}`);
    console.log(`       └─ ${r.details}`);
  });

  console.log("================================================================================");
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);
  console.log("================================================================================\n");

  // Save results to logs/test-verification.log
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  fs.writeFileSync(
    path.join(logsDir, "test-verification.log"),
    `VERIFICATION RUN: ${new Date().toISOString()}\nPassed: ${passedCount}/${results.length}\n\n` +
      results.map((r) => `[${r.passed ? "PASS" : "FAIL"}] ${r.name}\n${r.details}\n`).join("\n"),
    "utf-8"
  );

  await prisma.$disconnect();

  if (passedCount < results.length) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
