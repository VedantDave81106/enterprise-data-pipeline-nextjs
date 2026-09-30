# Shri Vile Parle Kelavani Mandal's
## DWARKADAS J. SANGHVI COLLEGE OF ENGINEERING
*(Autonomous College Affiliated to the University of Mumbai)*  
**NAAC Accredited with "A" Grade (CGPA: 3.18)**

### Department of Artificial Intelligence and Machine Learning
**B.Tech. Sem: V**  
**Subject: Fullstack Development with NextJs (DJS23AMD302)**

---

# Relational Data Seeding, Transactional Notifications & Secure Endpoints

A full-stack Next.js application that integrates automated relational database seeding with Faker.js, role-based session authorization via Next.js Edge Middleware, transactional email notifications using Resend and React Email, and webhook ingestion across relational (Prisma ORM) and document (Mongoose ODM) datastores.

---

## 📦 Deliverables Checklist

* **Source code repository** including `prisma/schema.prisma`, `prisma/seed.ts`, API route handlers, and React Email components.
* **Terminal logs** demonstrating successful migration, seed execution, and persisted records (`logs/pipeline-execution.log` and `logs/test-verification.log`).
* **A 2-page system architecture note** documenting data relationships, authorization flow diagrams, and email delivery dispatch logs (`docs/ARCHITECTURE_NOTE.md` and embedded on the web portal).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS, Lucide Icons |
| **Relational Database** | Prisma ORM with SQLite (local zero-config) / PostgreSQL (production) |
| **Authentication & RBAC** | Better Auth, Next.js Edge Middleware / Proxy Layer |
| **Mock Data Engine** | `@faker-js/faker` |
| **Transactional Email** | Resend API, `@react-email/components`, `@react-email/render` |
| **Object Database** | Mongoose ODM (MongoDB document telemetry store) |

---

## 🏗️ System Architecture & Workflow

```text
[ Client Request ]
       │
       ▼
[ Next.js Edge Middleware (middleware.ts) ]
       │── Parses session token / cookies
       │── Checks RBAC permission: ADMIN > MEMBER > GUEST
       │── Injects verified tenant headers (x-user-id, x-user-role, x-org-id)
       ▼
[ Protected Route Handlers ]
       ├── GET /api/admin/metrics       (Admin only)
       ├── GET, POST /api/transactions  (Tenant scoped)
       └── POST /api/webhooks/resend    (Webhook ingestion)
       │
       ├──► [ Prisma ORM ] ────────────► Relational Tables (Users, Orgs, Txns, Audits)
       ├──► [ React Email + Resend ] ──► Transactional Email Alert Dispatch
       └──► [ Mongoose ODM ] ──────────► Raw Webhook Telemetry Document Store
```

---

## 🗄️ Database Schema & Entities

The relational schema is defined with Third Normal Form (3NF) constraints in `prisma/schema.prisma`:

* **`Organization`**: Multi-tenant workspace entity with subscription tiers (`FREE`, `PRO`, `ENTERPRISE`).
* **`User`**: Account entity containing role assignment (`ADMIN`, `MEMBER`, `GUEST`) and organization link.
* **`Transaction`**: Financial records with status (`PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`), monetary amounts, and verified foreign keys to parent User and Organization.
* **`AuditLog`**: Security audit log capturing authentication events, role checks, and database mutations.
* **`EmailDispatchLog`**: Relational tracking of transactional email dispatches, status transitions, and delivery timestamps.
* **`Session` / `Account` / `Verification`**: Better Auth tables for session validation.
* **`RawWebhookEvent` (Mongoose Document)**: Flexible document model in MongoDB storing raw unnormalized JSON payloads received from external webhooks.

---

## 🔐 Edge Middleware & Role-Based Access Control

The Next.js Edge Middleware layer (`middleware.ts` & `lib/proxy-gate.ts`) intercepts requests before route handlers execute:

* **`/admin/*` & `/api/admin/*`**: Enforces strict `ADMIN` role. Requests from members, guests, or unauthenticated users receive `HTTP 403 Forbidden` or `HTTP 401 Unauthorized`.
* **`/member/*` & `/api/member/*`**: Restricted to users with `ADMIN` or `MEMBER` roles.
* **`/api/transactions`**: Enforces multi-tenant data boundaries. Queries are scoped strictly to the authenticated user's `organizationId`.
* **Header Forwarding**: On authorized requests, the proxy gate injects `x-user-id`, `x-user-email`, `x-user-role`, and `x-organization-id` into downstream request headers.

---

## 📧 Transactional Email & Webhook Ingestion

1. **Mutation Trigger**: When a transaction is created via `POST /api/transactions`, the backend automatically renders a responsive HTML email using `TransactionAlertEmail.tsx`.
2. **Dispatch**: The email is dispatched through the Resend API (`resend.emails.send`), and a record is saved to `EmailDispatchLog` with an accompanying `AuditLog` entry.
3. **Webhook Ingestion**: When Resend dispatches delivery or bounce events to `POST /api/webhooks/resend`:
   * **Relational Store (Prisma)**: Updates the delivery status (`DELIVERED` / `BOUNCED`) and timestamp in `EmailDispatchLog`.
   * **Document Store (Mongoose)**: Saves the complete, unconstrained JSON event payload into MongoDB via `RawWebhookEvent`.

---

## 📁 Repository Directory Structure

```text
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── metrics/route.ts      # Admin aggregate statistics endpoint
│   │   ├── auth/
│   │   │   └── [...all]/route.ts     # Better Auth catch-all API handler
│   │   ├── dashboard/
│   │   │   └── overview/route.ts     # Telemetry summary endpoint
│   │   ├── transactions/route.ts     # Multi-tenant transaction CRUD + Resend trigger
│   │   └── webhooks/
│   │       └── resend/route.ts       # Resend webhook ingestion (Prisma + Mongoose)
│   ├── globals.css                   # Tailwind CSS styling and theme variables
│   ├── layout.tsx                    # Next.js root layout with metadata
│   └── page.tsx                      # Web evaluation portal with Light & Dark themes
├── docs/
│   └── ARCHITECTURE_NOTE.md          # 2-Page formal system architecture note & diagrams
├── emails/
│   └── TransactionAlertEmail.tsx     # Modular React Email template
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
│   └── RawWebhookEvent.ts            # Mongoose ODM Document schema for raw telemetry
├── prisma/
│   ├── schema.prisma                 # Multi-entity normalized schema (SQLite / PostgreSQL)
│   ├── schema.postgresql.prisma      # PostgreSQL schema definition
│   └── seed.ts                       # Localized Faker.js database seeding pipeline
├── scripts/
│   ├── db-pipeline.ts                # Migration and automated seeding pipeline script
│   ├── test-endpoints.ts             # 10-point automated end-to-end verification suite
│   └── toggle-db.ts                  # Provider switcher (PostgreSQL <-> SQLite)
├── middleware.ts                     # Next.js Edge Middleware layer for RBAC proxy gates
├── next.config.ts                    # Next.js configuration
├── package.json                      # Project dependencies & scripts
├── tailwind.config.ts                # Tailwind CSS configuration
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## ⚡ Available NPM Scripts

* `npm run dev`: Starts the Next.js local development server on port 3000.
* `npm run build`: Compiles and verifies the optimized production Next.js build.
* `npm run start`: Runs the built Next.js production server.
* `npm run db:pipeline`: Generates Prisma client, synchronizes database schema, and seeds mock data via Faker.js in one command.
* `npm run db:reset`: Wipes existing records and re-executes the complete seeding pipeline.
* `npm run test:endpoints`: Executes the 10-point end-to-end automated test suite verifying database volume, foreign keys, RBAC gates, and webhook ingestion.
* `npm run db:generate`: Regenerates the Prisma Client.
* `npm run db:push`: Pushes schema changes directly to the database.
* `npm run db:seed`: Executes the Faker.js seeding script (`prisma/seed.ts`).
* `npm run db:toggle-pg`: Swaps active Prisma provider to PostgreSQL.
* `npm run db:toggle-sqlite`: Swaps active Prisma provider to SQLite.

---

## 📊 Verification Test Log Summary

Verified output from the automated test suite (`npm run test:endpoints`):

```text
================================================================================
🧪 AUTOMATED VERIFICATION SUITE: RELATIONAL DATA, RBAC & WEBHOOKS
================================================================================
✅ PASS [1] Relational Seeding Volume (Orgs >= 5, Users >= 25, Txns >= 100, Audits >= 150)
       └─ Actual Counts -> Orgs: 5, Users: 25, Txns: 100, Audits: 152
✅ PASS [2] Foreign-Key Integrity: User -> Organization Constraint
       └─ Orphaned Users Count: 0 (Expected 0)
✅ PASS [3] Foreign-Key Integrity: Transaction -> User -> Organization Alignment
       └─ Broken Transaction Relations: 0 / 20 inspected
✅ PASS [4] RBAC Gate: Admin Session accessing Admin Route (Expect Allowed: true)
       └─ Status: 200, Allowed: true
✅ PASS [5] RBAC Gate: Member Session accessing Admin Route (Expect 403 Forbidden)
       └─ Status: 403, Reason: Forbidden: Endpoint requires ADMIN privileges, but active session possesses MEMBER role.
✅ PASS [6] RBAC Gate: Guest Session attempting Mutation/Member Route (Expect 403 Forbidden)
       └─ Status: 403, Reason: Forbidden: Endpoint requires MEMBER privileges, but active session possesses GUEST role.
✅ PASS [7] RBAC Gate: Anonymous/Null Session (Expect 401 Unauthorized)
       └─ Status: 401, Reason: Authentication Required: Active session token or cookie was not found.
✅ PASS [8] Resend & React Email Dispatch on Mutation (Logs to EmailDispatchLog + AuditLog)
       └─ Mode: SIMULATED_MOCK_DISPATCH, Email ID: re_mock_1790790329281_dbu96y4
✅ PASS [9] Prisma Relational Persistence: EmailDispatchLog entry verified
       └─ Found record ID: cmuoebphl0000trf4yz9uolun, Recipient: admin@enterprise.demo
✅ PASS [10] Resend Webhook Ingestion: Dual persistence in Prisma (Relational) & Mongoose (Object DB)
       └─ Prisma Updated Status: DELIVERED | Mongoose Docs: 1
================================================================================
Total: 10 | Passed: 10 | Failed: 0
================================================================================
```
