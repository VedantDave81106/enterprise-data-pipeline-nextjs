# Automated Relational Data Seeding, Transactional Event Notification & Secure Full-Stack Endpoints

> **Course Outcomes Mapped:**
> - **CO3:** Execute secure authorization and multi-tenant session validation via Better Auth and Next.js Proxy/Middleware layers.
> - **CO4:** Deploy data-driven endpoints connecting relational platforms via Prisma ORM and object databases via Mongoose.
>
> **Associated Units:**
> - Unit IV (Database Integration: Prisma ORM & Mongoose)
> - Unit V (Modern Authentication, Session Control & Security)
> - Unit VI (Optimization, Edge Layers & Cloud Deployment)
>
> **Self-Learning Modules Covered:**
> - Topic 4: Database Seeding & Automated Mock Data with Faker.js
> - Topic 5: Transactional Email Integration with Resend & React Email
>
> **Mapped POs/PSOs:** PO3, PO5, PO11 | PSO 2

---

## 🌟 Executive Summary

This enterprise-grade application implements an automated backend service and data ingestion pipeline combining:
1. **Prisma ORM Normalized Relational Schema**: 3NF schema encompassing `Organizations`, `Users`, `Roles`, `Transactions`, `AuditLogs`, and `EmailDispatchLogs` with strict foreign-key integrity.
2. **Automated Mock Data Seeding**: High-fidelity localized dummy records generated using `@faker-js/faker` via an idempotent seeding script (`prisma/seed.ts`).
3. **Next.js Edge Middleware & Proxy Gates**: Role-Based Access Control (`ADMIN`, `MEMBER`, `GUEST`) and multi-tenant session parsing enforcing route isolation before requests reach backend handlers.
4. **Resend & React Email Transactional Engine**: Clean, responsive email component (`TransactionAlertEmail.tsx`) dispatched upon database mutations with delivery/bounce webhook ingestion.
5. **Hybrid Object Datastore via Mongoose**: Ingestion of raw unconstrained JSON webhook telemetry into MongoDB (`RawWebhookEvent`) satisfying CO4 dual-datastore outcomes.
6. **Interactive Evaluation Portal**: Web UI for testing RBAC proxy gates, triggering database mutations and Resend notifications, simulating webhooks, and browsing datastores live.

---

## 📁 Repository Directory Structure

```text
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── metrics/route.ts      # Protected Admin-only route handler (CO3)
│   │   ├── auth/
│   │   │   └── [...all]/route.ts     # Better Auth catch-all API handler
│   │   ├── dashboard/
│   │   │   └── overview/route.ts     # Telemetry summary endpoint
│   │   ├── transactions/route.ts     # Multi-tenant scoped CRUD + Resend trigger (CO3/CO4)
│   │   └── webhooks/
│   │       └── resend/route.ts       # Resend webhook ingestion (Prisma + Mongoose)
│   ├── globals.css                   # Tailwind CSS styling directives
│   ├── layout.tsx                    # Next.js root layout with metadata
│   └── page.tsx                      # Interactive verification portal & RBAC simulator
├── docs/
│   └── ARCHITECTURE_NOTE.md          # 2-Page formal system architecture note & diagrams
├── emails/
│   └── TransactionAlertEmail.tsx     # Modular React Email template (@react-email/components)
├── lib/
│   ├── auth.ts                       # Better Auth server configuration with Prisma adapter
│   ├── auth-client.ts                # Better Auth React client configuration
│   ├── email.ts                      # Resend email dispatch service & audit logger
│   ├── mongoose.ts                   # Mongoose connection & in-memory fallback store
│   ├── prisma.ts                     # Prisma Client singleton
│   └── proxy-gate.ts                 # Session parsing & RBAC role hierarchy validator
├── logs/
│   ├── pipeline-execution.log        # Timestamped CLI database reset & seed log
│   └── test-verification.log         # Automated 10-point test verification trace
├── models/
│   └── RawWebhookEvent.ts            # Mongoose ODM Document schema for raw telemetry (CO4)
├── prisma/
│   ├── schema.prisma                 # Active multi-entity normalized schema
│   ├── schema.postgresql.prisma      # Production PostgreSQL schema definition
│   └── seed.ts                       # Localized Faker.js database seeding pipeline
├── scripts/
│   ├── db-pipeline.ts                # Single-command reset, migration & seeding pipeline
│   ├── test-endpoints.ts             # 10-point automated end-to-end verification suite
│   └── toggle-db.ts                  # Provider switcher (PostgreSQL <-> SQLite)
├── middleware.ts                     # Next.js Edge Middleware layer for RBAC proxy gates
├── next.config.ts                    # Next.js configuration
├── package.json                      # Project dependencies & scripts
├── tailwind.config.ts                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
npm install
```

### 2. Run the Automated Database Pipeline (Single Command)
Executes client generation, database migration/push, and `@faker-js/faker` seeding in one command:
```bash
npm run db:pipeline
# or for full wipe and reseed:
npm run db:reset
```

### 3. Run the Automated Test Verification Suite
Verifies relational volume, foreign-key constraints, RBAC gates, Resend email triggers, and webhook dual persistence:
```bash
npm run test:endpoints
```

### 4. Start the Interactive Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to access the interactive evaluation dashboard.

---

## 🧪 Verification Matrix & Test Output

Run `npm run test:endpoints` to view the automated test suite results:

| # | Test Assertion | Expected Behavior | Result |
| :--- | :--- | :--- | :--- |
| 1 | Relational Seeding Volume | Orgs ≥ 5, Users ≥ 25, Txns ≥ 100, Audits ≥ 150 | **PASS** |
| 2 | User-Organization Foreign Key | Zero orphaned users | **PASS** |
| 3 | Transaction Foreign Key Alignment | Verified parent Org & User integrity | **PASS** |
| 4 | Admin Privilege Gate | HTTP 200 OK for ADMIN session | **PASS** |
| 5 | Member Privilege Restriction | HTTP 403 Forbidden for MEMBER on Admin route | **PASS** |
| 6 | Guest Privilege Restriction | HTTP 403 Forbidden on mutation routes | **PASS** |
| 7 | Anonymous Request Gate | HTTP 401 Unauthorized for null session | **PASS** |
| 8 | Resend & React Email Trigger | Lifecycle email dispatched on DB mutation | **PASS** |
| 9 | Relational Dispatch Persistence | `EmailDispatchLog` record created in Prisma | **PASS** |
| 10 | Resend Webhook Dual-Store | Status updated in Prisma AND logged in Mongoose | **PASS** |

---

## 🗄️ Database Provider Switching (PostgreSQL / SQLite)

The repository is built to support both **PostgreSQL** (the syllabus standard) and **SQLite** (for zero-configuration local evaluation):

* To toggle schema to **PostgreSQL**:
  ```bash
  npx tsx scripts/toggle-db.ts postgres
  ```
* To toggle schema back to **SQLite**:
  ```bash
  npx tsx scripts/toggle-db.ts sqlite
  ```

---

## 📄 Deliverables Summary

1. **Source Code**: Fully typed, production-ready Next.js App Router codebase.
2. **Architecture Note**: Formal 2-page document at [docs/ARCHITECTURE_NOTE.md](file:///c:/Users/Hp/Desktop/FST_SL_2/docs/ARCHITECTURE_NOTE.md) including ERDs, Sequence Diagrams, and RBAC matrix.
3. **Automated Logs**: Live execution traces at `logs/pipeline-execution.log` and `logs/test-verification.log`.
4. **Interactive Dashboard**: Web interface for live evaluation of all syllabus requirements.
