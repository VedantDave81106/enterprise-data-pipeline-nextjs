import { PrismaClient, Role, TransactionStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [Seed Pipeline] Commencing relational database mock data ingestion...");
  const startTime = Date.now();

  // 1. Purge existing data in reverse foreign-key dependency order
  console.log("🧹 [Seed Pipeline] Cleaning existing records for idempotency...");
  await prisma.emailDispatchLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 2. Populate Organizations (Multi-tenant boundary)
  console.log("🏢 [Seed Pipeline] Creating multi-tenant Organizations...");
  const orgDefinitions = [
    { name: "Acme Enterprise Solutions", slug: "acme-corp", tier: "ENTERPRISE" },
    { name: "FinTech Horizons Inc.", slug: "fintech-horizons", tier: "ENTERPRISE" },
    { name: "Nexus Cyber Systems", slug: "nexus-cyber", tier: "PRO" },
    { name: "Vanguard Health Analytics", slug: "vanguard-health", tier: "PRO" },
    { name: "Apex Global Ventures", slug: "apex-ventures", tier: "FREE" },
  ];

  const organizations = [];
  for (const orgDef of orgDefinitions) {
    const org = await prisma.organization.create({
      data: orgDef,
    });
    organizations.push(org);
  }
  console.log(`✅ Created ${organizations.length} organizations.`);

  // 3. Populate Users with Roles & Foreign Keys
  console.log("👥 [Seed Pipeline] Populating localized Users across Roles (ADMIN, MEMBER, GUEST)...");
  const users = [];

  // Seed designated demo accounts for instant evaluation
  const demoAdmin = await prisma.user.create({
    data: {
      name: "Super Administrator",
      email: "admin@enterprise.demo",
      role: Role.ADMIN,
      emailVerified: true,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=AdminDemo",
      organizationId: organizations[0].id,
    },
  });
  users.push(demoAdmin);

  const demoMember = await prisma.user.create({
    data: {
      name: "Alice Montgomery (Member)",
      email: "alice.member@enterprise.demo",
      role: Role.MEMBER,
      emailVerified: true,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=AliceDemo",
      organizationId: organizations[0].id,
    },
  });
  users.push(demoMember);

  const demoGuest = await prisma.user.create({
    data: {
      name: "Carlos Guest (Observer)",
      email: "carlos.guest@enterprise.demo",
      role: Role.GUEST,
      emailVerified: false,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=CarlosDemo",
      organizationId: organizations[1].id,
    },
  });
  users.push(demoGuest);

  // Seed remaining users across organizations using Faker.js
  const rolesDistribution: Role[] = [
    Role.ADMIN,
    Role.MEMBER, Role.MEMBER, Role.MEMBER, Role.MEMBER,
    Role.GUEST, Role.GUEST,
  ];

  for (let i = 0; i < 22; i++) {
    const assignedOrg = organizations[i % organizations.length];
    const assignedRole = rolesDistribution[i % rolesDistribution.length];
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const email = faker.internet.email({ firstName, lastName, provider: `${assignedOrg.slug}.io` }).toLowerCase();

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        emailVerified: faker.datatype.boolean({ probability: 0.85 }),
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        role: assignedRole,
        organizationId: assignedOrg.id,
      },
    });
    users.push(user);
  }
  console.log(`✅ Seeded ${users.length} Users with relational foreign keys.`);

  // 4. Populate Transactions with strict Foreign Key Integrity
  console.log("💳 [Seed Pipeline] Generating normalized Transactions with foreign-key integrity...");
  const transactionCategories = [
    "CLOUD_INFRASTRUCTURE",
    "VENDOR_PAYMENT",
    "EQUIPMENT_PROCUREMENT",
    "SOFTWARE_LICENSING",
    "SECURITY_AUDIT",
    "DATA_ANALYTICS_PLATFORM",
  ];

  const statuses: TransactionStatus[] = [
    TransactionStatus.COMPLETED,
    TransactionStatus.COMPLETED,
    TransactionStatus.COMPLETED,
    TransactionStatus.PENDING,
    TransactionStatus.FAILED,
    TransactionStatus.REFUNDED,
  ];

  const transactions = [];
  for (let i = 0; i < 100; i++) {
    // Pick a user and use that user's actual organizationId to maintain relational integrity
    const user = faker.helpers.arrayElement(users.filter((u) => u.organizationId !== null));
    const status = faker.helpers.arrayElement(statuses);
    const category = faker.helpers.arrayElement(transactionCategories);
    const amount = parseFloat(faker.finance.amount({ min: 25, max: 28500, dec: 2 }));
    const refCode = `TXN-${faker.string.alphanumeric({ length: 8, casing: "upper" })}`;

    const txn = await prisma.transaction.create({
      data: {
        referenceCode: refCode,
        amount,
        currency: "USD",
        status,
        category,
        description: `${category.replace(/_/g, " ")}: ${faker.commerce.productName()}`,
        userId: user.id,
        organizationId: user.organizationId!,
        createdAt: faker.date.recent({ days: 60 }),
      },
    });
    transactions.push(txn);
  }
  console.log(`✅ Seeded ${transactions.length} Transactions.`);

  // 5. Populate Audit Logs capturing realistic system, security, and transaction events
  console.log("🛡️ [Seed Pipeline] Creating relational Audit Logs...");
  const auditActions = [
    "USER_AUTHENTICATED",
    "TRANSACTION_INITIALIZED",
    "TRANSACTION_SETTLED",
    "ROLE_ESCALATION_CHECK",
    "PROXY_GATE_VERIFIED",
    "EMAIL_NOTIFICATION_DISPATCHED",
    "MEMBER_INVITED",
    "TENANT_SCOPED_QUERY",
  ];

  for (let i = 0; i < 150; i++) {
    const user = faker.helpers.arrayElement(users);
    const action = faker.helpers.arrayElement(auditActions);
    const ip = faker.internet.ipv4();

    await prisma.auditLog.create({
      data: {
        action,
        resource: action.includes("TRANSACTION") ? "Transaction" : action.includes("USER") ? "User" : "SecurityProxy",
        details: JSON.stringify({
          initiator: user.email,
          status: "SUCCESS",
          telemetry: {
            latencyMs: faker.number.int({ min: 12, max: 140 }),
            edgeRegion: faker.helpers.arrayElement(["iad1", "sfo1", "fra1", "sin1"]),
          },
        }),
        ipAddress: ip,
        userAgent: faker.internet.userAgent(),
        userId: user.id,
        organizationId: user.organizationId,
        createdAt: faker.date.recent({ days: 30 }),
      },
    });
  }
  console.log("✅ Seeded 150 relational Audit Logs.");

  // 6. Populate Email Dispatch Logs (Resend Integration Records)
  console.log("📧 [Seed Pipeline] Generating Email Dispatch Logs for transactional events...");
  const emailEvents = ["DISPATCHED", "SENT", "DELIVERED", "DELIVERED", "BOUNCED"];
  for (let i = 0; i < 25; i++) {
    const user = faker.helpers.arrayElement(users);
    const eventType = faker.helpers.arrayElement(emailEvents);
    const resendId = `re_${faker.string.alphanumeric({ length: 24, casing: "lower" })}`;

    await prisma.emailDispatchLog.create({
      data: {
        resendEmailId: resendId,
        recipientEmail: user.email,
        subject: `Security Alert: High-Value Transaction Notification (#${faker.string.alphanumeric(6).toUpperCase()})`,
        eventType,
        status: eventType === "BOUNCED" ? "FAILED" : "SUCCESS",
        metadata: JSON.stringify({
          provider: "Resend",
          attempt: 1,
          clientType: "ReactEmailEngine",
          statusCode: eventType === "BOUNCED" ? 550 : 200,
        }),
        deliveredAt: eventType === "DELIVERED" ? faker.date.recent({ days: 10 }) : null,
        bouncedAt: eventType === "BOUNCED" ? faker.date.recent({ days: 10 }) : null,
        createdAt: faker.date.recent({ days: 20 }),
      },
    });
  }
  console.log("✅ Seeded 25 Email Dispatch Logs.");

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 [Seed Pipeline Completed] Ingestion completed in ${totalTime}s!`);
  console.log("--------------------------------------------------");
  console.log(`• Organizations: ${organizations.length}`);
  console.log(`• Users:         ${users.length}`);
  console.log(`• Transactions:  ${transactions.length}`);
  console.log(`• Audit Logs:    150`);
  console.log(`• Email Logs:    25`);
  console.log("--------------------------------------------------\n");
}

main()
  .catch((e) => {
    console.error("❌ [Seed Pipeline Error]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
