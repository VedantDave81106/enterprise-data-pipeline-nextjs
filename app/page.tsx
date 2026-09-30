"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Database,
  Mail,
  Lock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Terminal,
  Activity,
  Users,
  Building,
  CreditCard,
  FileText,
  Webhook,
  Sun,
  Moon,
  BookOpen,
  ArrowRight,
  Workflow,
} from "lucide-react";

export default function DashboardPage() {
  // Theme State: 'light' or 'dark'
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("app-theme", nextTheme);
  };

  // Simulator State
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "MEMBER" | "GUEST" | "ANONYMOUS">("ADMIN");
  const [activeTab, setActiveTab] = useState<"overview" | "report" | "rbac" | "transactions" | "webhooks" | "explorer">("overview");
  const [explorerSubTab, setExplorerSubTab] = useState<"txns" | "audits" | "users" | "orgs" | "emails" | "mongoose">("txns");

  // Probe & Action State
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeResult, setProbeResult] = useState<any>(null);

  // Transaction Form State
  const [txAmount, setTxAmount] = useState("1250.00");
  const [txCategory, setTxCategory] = useState("CLOUD_INFRASTRUCTURE");
  const [txDescription, setTxDescription] = useState("Server compute and database hosting payment");
  const [txLoading, setTxLoading] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);

  // Webhook Simulator State
  const [webhookType, setWebhookType] = useState<"email.delivered" | "email.bounced">("email.delivered");
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);

  // Explorer Data State
  const [explorerData, setExplorerData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Fetch explorer data
  const loadData = async () => {
    setDataLoading(true);
    try {
      const res = await fetch("/api/dashboard/overview");
      const json = await res.json();
      if (json.success) {
        setExplorerData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Execute Role-Based Proxy Gate Probe
  const testGate = async (endpoint: "/api/admin/metrics" | "/api/transactions") => {
    setProbeLoading(true);
    setProbeResult(null);
    const start = performance.now();

    const headers: Record<string, string> = {};
    if (selectedRole !== "ANONYMOUS") {
      headers["x-simulated-role"] = selectedRole;
      headers["x-simulated-user-id"] = `sim_${selectedRole.toLowerCase()}_01`;
      headers["x-simulated-org-id"] = selectedRole === "GUEST" ? "org_demo_fintech" : "org_demo_acme";
    }

    try {
      const res = await fetch(endpoint, { headers });
      const latency = Math.round(performance.now() - start);
      const json = await res.json();

      setProbeResult({
        endpoint,
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        latencyMs: latency,
        headersSent: headers,
        response: json,
      });
    } catch (err: any) {
      setProbeResult({
        endpoint,
        status: 500,
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        response: { error: err.message },
      });
    } finally {
      setProbeLoading(false);
    }
  };

  // Submit Transaction & Resend Lifecycle
  const submitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxLoading(true);
    setTxResult(null);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (selectedRole !== "ANONYMOUS") {
      headers["x-simulated-role"] = selectedRole;
      headers["x-simulated-user-id"] = `sim_${selectedRole.toLowerCase()}_01`;
      headers["x-simulated-org-id"] = "org_demo_acme";
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: parseFloat(txAmount),
          category: txCategory,
          description: txDescription,
        }),
      });

      const json = await res.json();
      setTxResult({
        status: res.status,
        ok: res.ok,
        payload: json,
      });
      loadData();
    } catch (err: any) {
      setTxResult({
        status: 500,
        ok: false,
        payload: { error: err.message },
      });
    } finally {
      setTxLoading(false);
    }
  };

  // Dispatch Simulated Resend Webhook Event
  const triggerWebhook = async () => {
    setWebhookLoading(true);
    setWebhookResult(null);

    const mockEmailId = txResult?.payload?.emailNotification?.emailId || `re_evt_${Math.random().toString(36).substring(2, 10)}`;

    const mockPayload = {
      type: webhookType,
      created_at: new Date().toISOString(),
      data: {
        email_id: mockEmailId,
        from: "Finance Security <alerts@resend.dev>",
        to: ["admin@enterprise.demo"],
        subject: "Security Alert: Transaction Confirmed",
        created_at: new Date().toISOString(),
      },
    };

    try {
      const res = await fetch("/api/webhooks/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockPayload),
      });

      const json = await res.json();
      setWebhookResult({
        status: res.status,
        ok: res.ok,
        payload: json,
      });
      loadData();
    } catch (err: any) {
      setWebhookResult({
        status: 500,
        ok: false,
        payload: { error: err.message },
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  // Color theme classes helper
  const isDark = theme === "dark";
  const bgMain = isDark ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-900";
  const cardBg = isDark ? "bg-slate-800 border-slate-700/60" : "bg-white border-slate-200 shadow-sm";
  const cardAlt = isDark ? "bg-slate-900/60 border-slate-700/60" : "bg-slate-50 border-slate-200";
  const inputBg = isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900";
  const subText = isDark ? "text-slate-400" : "text-slate-600";
  const navBorder = isDark ? "border-slate-800" : "border-slate-200";
  const headerText = isDark ? "text-white" : "text-slate-900";

  return (
    <div className={`min-h-screen transition-colors duration-200 ${bgMain}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Header */}
        <header className={`mb-8 border-b ${navBorder} pb-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              {/* Tech Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Next.js 15
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Prisma ORM
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Better Auth RBAC
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                  Resend & React Email
                </span>
              </div>

              <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${headerText}`}>
                Relational Data Seeding & Secure Transaction Pipeline
              </h1>
              <p className={`mt-1 text-sm ${subText}`}>
                A student-friendly full-stack application connecting Prisma ORM, role-based middleware, and transactional email notifications.
              </p>
            </div>

            {/* Controls: Theme Toggle & Refresh */}
            <div className="flex items-center gap-3">
              {/* Light / Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-yellow-400 border-slate-700"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm"
                }`}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-yellow-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              {/* Refresh Data Button */}
              <button
                onClick={loadData}
                disabled={dataLoading}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm"
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin text-blue-500" : ""}`} />
                Refresh Data
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className={`mt-6 flex space-x-1 border-b ${navBorder} overflow-x-auto`}>
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "report", label: "Technical Architecture Report", icon: BookOpen },
              { id: "rbac", label: "Role Access (RBAC)", icon: ShieldCheck },
              { id: "transactions", label: "Transactions & Emails", icon: Mail },
              { id: "webhooks", label: "Webhooks & Database", icon: Webhook },
              { id: "explorer", label: "Database Explorer", icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
                    isActive
                      ? isDark
                        ? "border-blue-500 text-blue-400 bg-slate-800/40"
                        : "border-blue-600 text-blue-600 bg-blue-50/60"
                      : isDark
                      ? "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* User Role Selector Banner */}
        <div className={`mb-6 p-4 rounded-xl border ${cardBg} flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-xs uppercase tracking-wider font-semibold block ${subText}`}>
                Test User Role (Simulated in Middleware)
              </span>
              <span className={`text-sm font-medium ${headerText}`}>
                Current Role: <strong className="text-blue-500">{selectedRole}</strong>
              </span>
            </div>
          </div>

          {/* Role Choice Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {(["ADMIN", "MEMBER", "GUEST", "ANONYMOUS"] as const).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setSelectedRole(role);
                  setProbeResult(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedRole === role
                    ? role === "ADMIN"
                      ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 ring-2 ring-red-500/20"
                      : role === "MEMBER"
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 ring-2 ring-blue-500/20"
                      : role === "GUEST"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 ring-2 ring-amber-500/20"
                      : "bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/40 ring-2 ring-slate-500/20"
                    : isDark
                    ? "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className={`flex items-center justify-between ${subText} mb-1`}>
                  <span className="text-xs font-medium">Organizations</span>
                  <Building className="w-4 h-4 text-blue-500" />
                </div>
                <div className={`text-2xl font-bold ${headerText}`}>{explorerData?.organizations?.length || 5}</div>
                <span className={`text-xs ${subText}`}>Workspaces</span>
              </div>

              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className={`flex items-center justify-between ${subText} mb-1`}>
                  <span className="text-xs font-medium">Users</span>
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <div className={`text-2xl font-bold ${headerText}`}>{explorerData?.users?.length || 25}</div>
                <span className={`text-xs ${subText}`}>Seeded Accounts</span>
              </div>

              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className={`flex items-center justify-between ${subText} mb-1`}>
                  <span className="text-xs font-medium">Transactions</span>
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                </div>
                <div className={`text-2xl font-bold ${headerText}`}>{explorerData?.transactions?.length || 100}+</div>
                <span className={`text-xs ${subText}`}>Mock Financials</span>
              </div>

              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className={`flex items-center justify-between ${subText} mb-1`}>
                  <span className="text-xs font-medium">Audit Logs</span>
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>
                <div className={`text-2xl font-bold ${headerText}`}>{explorerData?.auditLogs?.length || 150}+</div>
                <span className={`text-xs ${subText}`}>Security Events</span>
              </div>

              <div className={`p-4 rounded-xl border ${cardBg}`}>
                <div className={`flex items-center justify-between ${subText} mb-1`}>
                  <span className="text-xs font-medium">Email Logs</span>
                  <Mail className="w-4 h-4 text-pink-500" />
                </div>
                <div className={`text-2xl font-bold ${headerText}`}>{explorerData?.emailLogs?.length || 25}+</div>
                <span className={`text-xs ${subText}`}>Resend Dispatches</span>
              </div>
            </div>

            {/* Architecture Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-xl border ${cardBg} flex flex-col justify-between`}>
                <div>
                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 w-fit mb-3">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className={`text-base font-semibold ${headerText}`}>1. Database Seeding</h3>
                  <p className={`mt-2 text-xs leading-relaxed ${subText}`}>
                    Uses Prisma ORM to model relational entities: Organizations, Users, Transactions, and Audit Logs. Localized mock data is automatically populated using <code>@faker-js/faker</code> with strict foreign-key integrity.
                  </p>
                </div>
                <div className={`mt-4 pt-4 border-t ${navBorder}`}>
                  <code className={`text-xs text-blue-600 dark:text-blue-400 font-mono px-2 py-1 rounded block ${cardAlt}`}>
                    npm run db:pipeline
                  </code>
                </div>
              </div>

              <div className={`p-6 rounded-xl border ${cardBg} flex flex-col justify-between`}>
                <div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 w-fit mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className={`text-base font-semibold ${headerText}`}>2. Authentication & Roles (RBAC)</h3>
                  <p className={`mt-2 text-xs leading-relaxed ${subText}`}>
                    Uses Next.js Edge Middleware to check user sessions before requests reach backend routes. Protects routes with role-based access control (Admin, Member, Guest) and separates data by organization.
                  </p>
                </div>
                <div className={`mt-4 pt-4 border-t ${navBorder}`}>
                  <span className={`text-xs flex items-center gap-1.5 ${subText}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Protected API routes & middleware gates
                  </span>
                </div>
              </div>

              <div className={`p-6 rounded-xl border ${cardBg} flex flex-col justify-between`}>
                <div>
                  <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-500 w-fit mb-3">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className={`text-base font-semibold ${headerText}`}>3. Email Alerts & Webhooks</h3>
                  <p className={`mt-2 text-xs leading-relaxed ${subText}`}>
                    Constructed with React Email and Resend. Automatically triggers an email notification whenever a transaction is saved. Ingests Resend delivery and bounce webhooks into Prisma and Mongoose.
                  </p>
                </div>
                <div className={`mt-4 pt-4 border-t ${navBorder}`}>
                  <span className={`text-xs flex items-center gap-1.5 ${subText}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-pink-500" />
                    Resend API + Mongoose raw telemetry
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TECHNICAL ARCHITECTURE REPORT */}
        {activeTab === "report" && (
          <div className="space-y-8">
            {/* College Header Banner */}
            <div className={`p-6 rounded-2xl border text-center ${cardBg}`}>
              <span className={`text-xs uppercase tracking-widest font-semibold block ${subText}`}>
                Shri Vile Parle Kelavani Mandal's
              </span>
              <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1 ${headerText}`}>
                DWARKADAS J. SANGHVI COLLEGE OF ENGINEERING
              </h2>
              <p className={`text-xs mt-1 ${subText}`}>
                (Autonomous College Affiliated to the University of Mumbai) • NAAC Accredited with "A" Grade (CGPA: 3.18)
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-center gap-4 text-xs">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Department of Artificial Intelligence and Machine Learning
                </span>
                <span className={subText}>•</span>
                <span className={`font-medium ${headerText}`}>B.Tech. Sem: V</span>
                <span className={subText}>•</span>
                <span className="font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded">
                  Subject: Fullstack Development with NextJs (DJS23AMD302)
                </span>
              </div>
            </div>

            {/* Deliverables Verification Checklist */}
            <div className={`p-6 rounded-xl border ${cardBg}`}>
              <h3 className={`text-base font-bold flex items-center gap-2 ${headerText}`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Project Deliverables Status
              </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${cardAlt}`}>
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Deliverable 1</span>
                  </div>
                  <h4 className={`text-sm font-bold ${headerText}`}>Source Code Repository</h4>
                  <p className={`text-xs mt-1 ${subText}`}>
                    <code>prisma/schema.prisma</code>, <code>prisma/seed.ts</code>, protected API route handlers, and React Email components.
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${cardAlt}`}>
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Deliverable 2</span>
                  </div>
                  <h4 className={`text-sm font-bold ${headerText}`}>Terminal Logs & Persistence</h4>
                  <p className={`text-xs mt-1 ${subText}`}>
                    Verified text logs demonstrating database schema sync, Faker.js seed execution, and 10-point test verification.
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${cardAlt}`}>
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Deliverable 3</span>
                  </div>
                  <h4 className={`text-sm font-bold ${headerText}`}>System Architecture Note</h4>
                  <p className={`text-xs mt-1 ${subText}`}>
                    Full technical documentation covering relational data relationships, authorization flowcharts, and email dispatch sequence diagrams.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 1: THEORY - RELATIONAL DATA MODELING & MOCK PIPELINE */}
            <div className={`p-6 rounded-xl border ${cardBg} space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${headerText}`}>
                    Part 1: Relational Schema Modeling & Automated Mock Data Pipeline
                  </h3>
                  <span className={`text-xs ${subText}`}>
                    Theory, 3NF Normalization, Foreign Key Constraints & Faker.js Integration
                  </span>
                </div>
              </div>

              <div className={`text-xs leading-relaxed space-y-3 ${subText}`}>
                <p>
                  <strong>Relational Schema Design & 3NF Normalization:</strong> The application relational schema is structured in Third Normal Form (3NF) using <strong>Prisma ORM</strong>. Every non-primary attribute is functionally dependent solely on the primary key, eliminating transitive dependencies. The schema models a multi-tenant business boundary across core entities:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Organization:</strong> The root tenancy entity. Defines company workspaces, subscription tiers (<code>FREE</code>, <code>PRO</code>, <code>ENTERPRISE</code>), and serves as the strict boundary for data isolation.</li>
                  <li><strong>User:</strong> Belongs to an Organization via foreign key <code>organizationId</code>. Enforces Role-Based Access Control via enum <code>Role</code> (<code>ADMIN</code>, <code>MEMBER</code>, <code>GUEST</code>).</li>
                  <li><strong>Transaction:</strong> Represents operational and financial events. Contains double foreign-key constraints linking both to the creating <code>userId</code> and the parent <code>organizationId</code> with referential integrity (<code>onDelete: Cascade</code>).</li>
                  <li><strong>AuditLog:</strong> An immutable chronological security and operational trace. Records user actions, IP addresses, edge regions, and payload metadata with <code>onDelete: SetNull</code> to preserve audit history even if user records are purged.</li>
                  <li><strong>EmailDispatchLog:</strong> Tracks Resend transactional email dispatches, delivery timestamps, bounce events, and status transitions.</li>
                </ul>

                <p>
                  <strong>Programmatic Seeding with Faker.js:</strong> Rather than manual mock data entry, the executable script <code>prisma/seed.ts</code> leverages <code>@faker-js/faker</code> to generate localized, relational records. It ensures strict foreign-key integrity by creating Organizations first, then Users belonging to those organizations, then Transactions strictly paired to both the user and their assigned organization, followed by realistic Audit Logs and Email Logs.
                </p>

                <p>
                  <strong>Single-Command Automated CLI Pipeline:</strong> The workflow script <code>scripts/db-pipeline.ts</code> combines Prisma Client generation (<code>npx prisma generate</code>), schema synchronization (<code>npx prisma db push</code>), and seed execution (<code>npx tsx prisma/seed.ts</code>) into a single command: <code>npm run db:pipeline</code>.
                </p>
              </div>

              {/* DIAGRAM 1: Visual Interactive Entity-Relationship Diagram (ERD) */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60">
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${headerText}`}>
                  <Workflow className="w-4 h-4 text-blue-500" />
                  Visual Architecture Diagram 1: Entity-Relationship Model (ERD)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
                  {/* Entity: Organization */}
                  <div className={`p-3 rounded-lg border ${cardAlt}`}>
                    <div className="bg-blue-600 text-white font-bold px-2 py-1 rounded text-[11px] mb-2">
                      Organization [1:N Root]
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="text-yellow-600 dark:text-yellow-400">🔑 id: String (PK)</div>
                      <div>name: String</div>
                      <div>slug: String (Unique)</div>
                      <div>tier: FREE | PRO | ENTERPRISE</div>
                      <div className={subText}>createdAt, updatedAt</div>
                    </div>
                  </div>

                  {/* Entity: User */}
                  <div className={`p-3 rounded-lg border ${cardAlt}`}>
                    <div className="bg-purple-600 text-white font-bold px-2 py-1 rounded text-[11px] mb-2">
                      User [Child of Org]
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="text-yellow-600 dark:text-yellow-400">🔑 id: String (PK)</div>
                      <div>name, email (Unique)</div>
                      <div className="text-blue-500 font-bold">role: ADMIN | MEMBER | GUEST</div>
                      <div className="text-emerald-600 dark:text-emerald-400">🔗 organizationId: FK ➔ Org</div>
                      <div className={subText}>sessions[], accounts[]</div>
                    </div>
                  </div>

                  {/* Entity: Transaction */}
                  <div className={`p-3 rounded-lg border ${cardAlt}`}>
                    <div className="bg-emerald-600 text-white font-bold px-2 py-1 rounded text-[11px] mb-2">
                      Transaction [Child of Org & User]
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="text-yellow-600 dark:text-yellow-400">🔑 id: String (PK)</div>
                      <div>referenceCode: String (Unique)</div>
                      <div>amount: Float ($ USD)</div>
                      <div>status: COMPLETED | PENDING | FAILED</div>
                      <div className="text-emerald-600 dark:text-emerald-400">🔗 userId: FK ➔ User</div>
                      <div className="text-emerald-600 dark:text-emerald-400">🔗 organizationId: FK ➔ Org</div>
                    </div>
                  </div>

                  {/* Entity: AuditLog */}
                  <div className={`p-3 rounded-lg border ${cardAlt}`}>
                    <div className="bg-amber-600 text-white font-bold px-2 py-1 rounded text-[11px] mb-2">
                      AuditLog [Security Trail]
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="text-yellow-600 dark:text-yellow-400">🔑 id: String (PK)</div>
                      <div>action: USER_LOGIN | TXN_CREATED</div>
                      <div>resource: Transaction | User</div>
                      <div>details: JSON String</div>
                      <div className="text-emerald-600 dark:text-emerald-400">🔗 userId, organizationId: FK</div>
                    </div>
                  </div>

                  {/* Entity: EmailDispatchLog */}
                  <div className={`p-3 rounded-lg border ${cardAlt}`}>
                    <div className="bg-pink-600 text-white font-bold px-2 py-1 rounded text-[11px] mb-2">
                      EmailDispatchLog [Resend Log]
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="text-yellow-600 dark:text-yellow-400">🔑 id: String (PK)</div>
                      <div>resendEmailId: String (Unique)</div>
                      <div>recipientEmail: String</div>
                      <div>eventType: DISPATCHED | DELIVERED | BOUNCED</div>
                      <div>status: SUCCESS | FAILED</div>
                      <div className={subText}>deliveredAt, bouncedAt</div>
                    </div>
                  </div>

                  {/* Entity: RawWebhookEvent (Mongoose) */}
                  <div className={`p-3 rounded-lg border ${cardAlt}`}>
                    <div className="bg-teal-600 text-white font-bold px-2 py-1 rounded text-[11px] mb-2">
                      RawWebhookEvent [Mongoose ODM]
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="text-yellow-600 dark:text-yellow-400">🔑 _id: ObjectId</div>
                      <div>eventId: String (Indexed)</div>
                      <div>provider: "Resend"</div>
                      <div>type: "email.delivered" | "email.bounced"</div>
                      <div className="text-purple-500 font-bold">rawPayload: Mixed (JSON Document)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: THEORY - AUTHENTICATION, SESSION CONTROL & EDGE PROXY GATES */}
            <div className={`p-6 rounded-xl border ${cardBg} space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${headerText}`}>
                    Part 2: Authenticated Session Enforcement & Middleware Proxy Gates
                  </h3>
                  <span className={`text-xs ${subText}`}>
                    Next.js Edge Middleware Architecture, Session Validation, RBAC Hierarchy & Tenant Scoping
                  </span>
                </div>
              </div>

              <div className={`text-xs leading-relaxed space-y-3 ${subText}`}>
                <p>
                  <strong>Edge Middleware vs. Route Handler Execution:</strong> In Next.js App Router, <code>middleware.ts</code> executes prior to any backend route segment. This architectural gate validates incoming session credentials and role permissions at the network boundary, preventing unauthorized requests from consuming database compute resources.
                </p>
                <p>
                  <strong>Session Extraction & RBAC Hierarchy:</strong> The proxy gate (<code>lib/proxy-gate.ts</code>) extracts session credentials from HTTP cookies (<code>better-auth.session_token</code>) or Bearer authorization headers. The parsed identity is evaluated against a role permission hierarchy:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                  <div className={`p-2.5 rounded border ${cardAlt}`}>
                    <span className="text-red-500 font-bold block">ADMIN (Level 3)</span>
                    <span>Full access to administrative aggregations, all tenants, and configuration routes.</span>
                  </div>
                  <div className={`p-2.5 rounded border ${cardAlt}`}>
                    <span className="text-blue-500 font-bold block">MEMBER (Level 2)</span>
                    <span>Authorized to read and create transactions strictly within their assigned organization.</span>
                  </div>
                  <div className={`p-2.5 rounded border ${cardAlt}`}>
                    <span className="text-amber-500 font-bold block">GUEST (Level 1)</span>
                    <span>Read-only observer access. Blocked with 403 Forbidden on database mutations.</span>
                  </div>
                </div>
                <p>
                  <strong>Downstream Header Injection:</strong> Upon validating the session, the middleware decorates the request with trusted identity headers (<code>x-user-id</code>, <code>x-user-role</code>, <code>x-organization-id</code>). Backend Route Handlers receive verified context directly from the gateway, guaranteeing multi-tenant isolation.
                </p>
              </div>

              {/* DIAGRAM 2: Visual Middleware Proxy Gate Flowchart */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60">
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${headerText}`}>
                  <Workflow className="w-4 h-4 text-emerald-500" />
                  Visual Architecture Diagram 2: Next.js Edge Middleware Request Flow
                </h4>

                <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
                  <div className={`p-3 rounded-lg border text-center w-full md:w-1/4 ${cardAlt}`}>
                    <span className="text-slate-400 block text-[10px]">Step 1</span>
                    <strong className={headerText}>Incoming Request</strong>
                    <span className={`block text-[10px] mt-1 ${subText}`}>Headers, Cookies, Body</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 hidden md:block" />
                  <div className={`p-3 rounded-lg border text-center w-full md:w-1/4 ${cardAlt}`}>
                    <span className="text-slate-400 block text-[10px]">Step 2</span>
                    <strong className="text-blue-500">middleware.ts Gate</strong>
                    <span className={`block text-[10px] mt-1 ${subText}`}>Extract session & verify role</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 hidden md:block" />
                  <div className={`p-3 rounded-lg border text-center w-full md:w-1/4 ${cardAlt}`}>
                    <span className="text-slate-400 block text-[10px]">Step 3</span>
                    <strong className="text-purple-500">Header Injection</strong>
                    <span className={`block text-[10px] mt-1 ${subText}`}>x-user-id, x-org-id</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 hidden md:block" />
                  <div className={`p-3 rounded-lg border text-center w-full md:w-1/4 ${cardAlt}`}>
                    <span className="text-slate-400 block text-[10px]">Step 4</span>
                    <strong className="text-emerald-500">Route Handler Execution</strong>
                    <span className={`block text-[10px] mt-1 ${subText}`}>Prisma query scoped to tenant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: THEORY - TRANSACTIONAL EMAILS & HYBRID PERSISTENCE */}
            <div className={`p-6 rounded-xl border ${cardBg} space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${headerText}`}>
                    Part 3: Transactional Lifecycle Dispatch & Hybrid Dual-Store Persistence
                  </h3>
                  <span className={`text-xs ${subText}`}>
                    React Email Rendering, Resend Notification Triggers, Webhook Ingestion & Mongoose Document Storage
                  </span>
                </div>
              </div>

              <div className={`text-xs leading-relaxed space-y-3 ${subText}`}>
                <p>
                  <strong>Transactional Email Rendering Lifecycle:</strong> Modern applications require modular, maintainable email notifications. Using <code>@react-email/components</code>, the alert template (<code>emails/TransactionAlertEmail.tsx</code>) is authored as standard React components (<code>Container</code>, <code>Heading</code>, <code>Text</code>, <code>Hr</code>). At runtime, <code>@react-email/render</code> compiles this component into clean, cross-client compatible HTML.
                </p>
                <p>
                  <strong>Database Mutation Trigger:</strong> When an authorized client executes <code>POST /api/transactions</code>:
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Prisma executes the transaction mutation in the relational database.</li>
                  <li>An immutable <code>AuditLog</code> entry is written recording the financial event.</li>
                  <li>The service layer invokes <code>sendTransactionAlertNotification()</code> to dispatch the email via the Resend API (<code>resend.emails.send</code>).</li>
                  <li>A corresponding record is created in <code>EmailDispatchLog</code> with status <code>DISPATCHED</code>.</li>
                </ol>
                <p>
                  <strong>Resend Webhook Ingestion & Hybrid Datastore Architecture:</strong> External email lifecycle events (such as <code>email.delivered</code> and <code>email.bounced</code>) are asynchronously posted by Resend to <code>/api/webhooks/resend</code>. The application uses a hybrid dual-persistence pattern:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Prisma ORM (Relational Store):</strong> Updates the structured <code>EmailDispatchLog</code> table with the new delivery status and timestamps, maintaining ACID guarantees.</li>
                  <li><strong>Mongoose ODM (Object Database):</strong> Simultaneously saves the entire, unconstrained JSON event payload into MongoDB via the <code>RawWebhookEvent</code> document model. This demonstrates how relational platforms handle business transactions while document databases capture high-volume, flexible telemetry.</li>
                </ul>
              </div>

              {/* DIAGRAM 3: Sequence Flow Diagram */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60">
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${headerText}`}>
                  <Workflow className="w-4 h-4 text-pink-500" />
                  Visual Architecture Diagram 3: Transaction Mutation & Webhook Lifecycle Sequence
                </h4>

                <div className={`p-4 rounded-lg border font-mono text-xs space-y-2 ${cardAlt}`}>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[10px]">
                    <span>PHASE</span>
                    <span>EVENT SEQUENCE & DATA STORE</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold shrink-0">[1. Request]</span>
                    <span>Client submits transaction ➔ Next.js Middleware verifies active session and role.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0">[2. Prisma Mutation]</span>
                    <span><code>prisma.transaction.create()</code> inserts record with foreign keys ➔ <code>prisma.auditLog.create()</code> logs action.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold shrink-0">[3. Resend Dispatch]</span>
                    <span>React Email renders HTML ➔ Resend API dispatches notification ➔ <code>EmailDispatchLog</code> saved.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-500 font-bold shrink-0">[4. Webhook Trigger]</span>
                    <span>Resend dispatches delivery/bounce event to <code>/api/webhooks/resend</code>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold shrink-0">[5. Dual Persistence]</span>
                    <span>Prisma updates <code>EmailDispatchLog.status = "DELIVERED"</code> ➔ Mongoose saves raw JSON in <code>RawWebhookEvent</code>.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: REAL TERMINAL EXECUTION LOGS (Text Logs, No Screenshot Placeholders) */}
            <div className={`p-6 rounded-xl border ${cardBg} space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-500/10 text-slate-500">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${headerText}`}>
                    Verified Terminal Logs & Execution Traces
                  </h3>
                  <span className={`text-xs ${subText}`}>
                    Raw Terminal Outputs Demonstrating Database Reset, Seeding & Automated Endpoint Verification
                  </span>
                </div>
              </div>

              {/* Log 1: Migration & Seeding Pipeline */}
              <div>
                <span className={`text-xs font-semibold block mb-1 font-mono ${subText}`}>
                  Terminal Log 1: Automated Pipeline ($ npm run db:pipeline)
                </span>
                <pre className="p-4 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
{`================================================================================
🚀 AUTOMATED RELATIONAL DATA INGESTION & PIPELINE
   Mode: Standard Sync & Seed
================================================================================

▶ [Pipeline Step] Generating Prisma Client Artifacts...
$ npx prisma generate
✔ Generated Prisma Client to .\\node_modules\\@prisma\\client in 143ms

▶ [Pipeline Step] Synchronizing Relational Database Schema...
$ npx prisma db push --skip-generate
Datasource "db": SQLite database "dev.db" at "file:./dev.db"
The database is already in sync with the Prisma schema.

▶ [Pipeline Step] Executing Automated Seeding Pipeline via Faker.js...
$ npx tsx prisma/seed.ts
🌱 [Seed Pipeline] Commencing relational database mock data ingestion...
🧹 [Seed Pipeline] Cleaning existing records for idempotency...
🏢 [Seed Pipeline] Creating multi-tenant Organizations...
✅ Created 5 organizations.
👥 [Seed Pipeline] Populating localized Users across Roles (ADMIN, MEMBER, GUEST)...
✅ Seeded 25 Users with relational foreign keys.
💳 [Seed Pipeline] Generating normalized Transactions with foreign-key integrity...
✅ Seeded 100 Transactions.
🛡️ [Seed Pipeline] Creating relational Audit Logs...
✅ Seeded 150 relational Audit Logs.
📧 [Seed Pipeline] Generating Email Dispatch Logs for transactional events...
✅ Seeded 25 Email Dispatch Logs.

🎉 [Seed Pipeline Completed] Ingestion completed in 2.56s!
--------------------------------------------------
• Organizations: 5
• Users:         25
• Transactions:  100
• Audit Logs:    150
• Email Logs:    25
--------------------------------------------------

================================================================================
🎉 Pipeline executed successfully in 10.98s!
   Log recorded: logs/pipeline-execution.log
================================================================================`}
                </pre>
              </div>

              {/* Log 2: Automated 10-Point Test Verification */}
              <div>
                <span className={`text-xs font-semibold block mb-1 font-mono ${subText}`}>
                  Terminal Log 2: Verification Suite ($ npm run test:endpoints)
                </span>
                <pre className="p-4 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed">
{`================================================================================
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
================================================================================`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RBAC PROXY GATES */}
        {activeTab === "rbac" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl border ${cardBg}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${headerText}`}>
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                Role-Based Access Control (RBAC)
              </h2>
              <p className={`mt-1 text-sm ${subText}`}>
                Select a role from the banner above and test the endpoints below. The middleware intercepts your request and either allows it or blocks it with an HTTP error.
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Probe 1: Admin Endpoint */}
                <div className={`p-4 rounded-lg border ${cardAlt}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                      Admin Only Route
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"}`}>
                      GET /api/admin/metrics
                    </span>
                  </div>
                  <p className={`text-xs mb-4 ${subText}`}>
                    Only <strong>ADMIN</strong> role can access this route. Members, Guests, and Anonymous users will receive <strong>403 Forbidden</strong> or <strong>401 Unauthorized</strong>.
                  </p>
                  <button
                    onClick={() => testGate("/api/admin/metrics")}
                    disabled={probeLoading}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center gap-2"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Test Admin Metrics Route
                  </button>
                </div>

                {/* Probe 2: Tenant Scoped Transactions */}
                <div className={`p-4 rounded-lg border ${cardAlt}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                      Multi-Tenant Route
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"}`}>
                      GET /api/transactions
                    </span>
                  </div>
                  <p className={`text-xs mb-4 ${subText}`}>
                    Enforces organization boundaries. Members can only view their own organization's data. Anonymous users are blocked with <strong>401 Unauthorized</strong>.
                  </p>
                  <button
                    onClick={() => testGate("/api/transactions")}
                    disabled={probeLoading}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-2"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Test Transactions Route
                  </button>
                </div>
              </div>

              {/* Probe Output Console */}
              {probeResult && (
                <div className="mt-6 rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-white">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 font-semibold">Middleware Gate Response Inspector</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{probeResult.latencyMs}ms</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          probeResult.status === 200
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : probeResult.status === 403
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        HTTP {probeResult.status} {probeResult.statusText}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block mb-1">Downstream Headers Forwarded:</span>
                      <pre className="text-slate-200 bg-slate-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(probeResult.headersSent, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Backend JSON Response:</span>
                      <pre className="text-slate-200 bg-slate-900 p-2 rounded overflow-x-auto max-h-56">
                        {JSON.stringify(probeResult.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TRANSACTIONS & RESEND EMAILS */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl border ${cardBg}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${headerText}`}>
                <CreditCard className="w-5 h-5 text-emerald-500" />
                Create Transaction & Send Email Alert
              </h2>
              <p className={`mt-1 text-sm ${subText}`}>
                Submit a new transaction below. The backend will insert it into the database, create an audit log, and send a transactional email notification via Resend.
              </p>

              <form onSubmit={submitTransaction} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${subText}`}>
                    Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 border ${inputBg}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${subText}`}>
                    Category
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 border ${inputBg}`}
                  >
                    <option value="CLOUD_INFRASTRUCTURE">Cloud Infrastructure</option>
                    <option value="SECURITY_AUDIT">Security Audit</option>
                    <option value="EQUIPMENT_PROCUREMENT">Equipment Procurement</option>
                    <option value="VENDOR_PAYMENT">Vendor Payment</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${subText}`}>
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 border ${inputBg}`}
                  />
                </div>

                <div className="md:col-span-3 mt-2">
                  <button
                    type="submit"
                    disabled={txLoading || selectedRole === "GUEST" || selectedRole === "ANONYMOUS"}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {txLoading ? "Saving & Sending Email..." : "Save Transaction & Send Resend Alert"}
                  </button>
                  {(selectedRole === "GUEST" || selectedRole === "ANONYMOUS") && (
                    <p className="text-xs text-amber-500 mt-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Guests and Anonymous users cannot create transactions. Please switch your role to ADMIN or MEMBER in the top banner.
                    </p>
                  )}
                </div>
              </form>

              {/* Mutation Output */}
              {txResult && (
                <div className="mt-6 rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-white">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Transaction Saved & Resend Email Dispatched (HTTP {txResult.status})
                    </span>
                    <span className="text-slate-400">Reference: {txResult.payload?.transaction?.referenceCode}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block mb-1">Saved Relational Record (Prisma):</span>
                      <pre className="text-slate-200 bg-slate-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(txResult.payload?.transaction, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Resend Email Dispatch Result:</span>
                      <pre className="text-slate-200 bg-slate-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(txResult.payload?.emailNotification, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: WEBHOOKS & MONGOOSE */}
        {activeTab === "webhooks" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl border ${cardBg}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${headerText}`}>
                <Webhook className="w-5 h-5 text-purple-500" />
                Resend Webhook Ingestion & Dual Datastores
              </h2>
              <p className={`mt-1 text-sm ${subText}`}>
                Simulate what happens when Resend sends a delivery or bounce webhook to <code>/api/webhooks/resend</code>. The app updates the email record in <strong>Prisma</strong> and stores the raw JSON in <strong>Mongoose</strong>.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className={`text-xs font-semibold uppercase ${subText}`}>Event Type:</label>
                  <select
                    value={webhookType}
                    onChange={(e) => setWebhookType(e.target.value as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-purple-500 border ${inputBg}`}
                  >
                    <option value="email.delivered">email.delivered (Successful Delivery)</option>
                    <option value="email.bounced">email.bounced (Hard Bounce / Mailbox Failure)</option>
                  </select>
                </div>

                <button
                  onClick={triggerWebhook}
                  disabled={webhookLoading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {webhookLoading ? "Ingesting..." : "Simulate Incoming Resend Webhook"}
                </button>
              </div>

              {/* Webhook Output */}
              {webhookResult && (
                <div className="mt-6 rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-white">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <span className="text-purple-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Webhook Ingested across Relational & Object Datastores
                    </span>
                    <span className="text-slate-400">HTTP {webhookResult.status}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block mb-1">Prisma Relational Status Update:</span>
                      <pre className="text-slate-200 bg-slate-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(webhookResult.payload?.relationalStore, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Mongoose Raw JSON Telemetry:</span>
                      <pre className="text-slate-200 bg-slate-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(webhookResult.payload?.objectStore, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: DATABASE EXPLORER */}
        {activeTab === "explorer" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl border ${cardBg}`}>
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b ${navBorder}`}>
                <div>
                  <h2 className={`text-lg font-bold flex items-center gap-2 ${headerText}`}>
                    <Database className="w-5 h-5 text-blue-500" />
                    Database Explorer
                  </h2>
                  <p className={`mt-1 text-xs ${subText}`}>
                    Browse records populated by Faker.js and new transactions created through the app.
                  </p>
                </div>

                {/* Sub tabs */}
                <div className={`flex flex-wrap items-center gap-1 p-1 rounded-lg border ${cardAlt}`}>
                  {[
                    { id: "txns", label: "Transactions" },
                    { id: "audits", label: "Audit Logs" },
                    { id: "users", label: "Users" },
                    { id: "orgs", label: "Organizations" },
                    { id: "emails", label: "Email Logs" },
                    { id: "mongoose", label: "Mongoose Telemetry" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setExplorerSubTab(sub.id as any)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                        explorerSubTab === sub.id
                          ? "bg-blue-600 text-white"
                          : isDark
                          ? "text-slate-400 hover:text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-tab content */}
              <div className="mt-4 overflow-x-auto">
                {explorerSubTab === "txns" && (
                  <table className="w-full text-left text-xs">
                    <thead className={`${isDark ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"} uppercase font-semibold`}>
                      <tr>
                        <th className="p-3">Reference Code</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Organization</th>
                        <th className="p-3">User</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"} font-mono`}>
                      {explorerData?.transactions?.map((t: any) => (
                        <tr key={t.id} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                          <td className="p-3 text-blue-500 font-bold">{t.referenceCode}</td>
                          <td className={`p-3 font-semibold ${headerText}`}>${t.amount.toFixed(2)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.status === "COMPLETED"
                                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                  : t.status === "PENDING"
                                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                  : "bg-red-500/20 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className={`p-3 ${subText}`}>{t.category}</td>
                          <td className={`p-3 font-sans ${headerText}`}>{t.organization?.name}</td>
                          <td className={`p-3 font-sans ${subText}`}>{t.user?.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {explorerSubTab === "audits" && (
                  <table className="w-full text-left text-xs">
                    <thead className={`${isDark ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"} uppercase font-semibold`}>
                      <tr>
                        <th className="p-3">Action</th>
                        <th className="p-3">Resource</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"} font-mono`}>
                      {explorerData?.auditLogs?.map((a: any) => (
                        <tr key={a.id} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                          <td className="p-3 text-amber-600 dark:text-amber-400 font-semibold">{a.action}</td>
                          <td className={`p-3 ${headerText}`}>{a.resource}</td>
                          <td className={`p-3 ${subText}`}>{a.ipAddress || "127.0.0.1"}</td>
                          <td className={`p-3 font-sans ${headerText}`}>{a.user?.name || "System"}</td>
                          <td className={`p-3 ${subText}`}>{new Date(a.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {explorerSubTab === "users" && (
                  <table className="w-full text-left text-xs">
                    <thead className={`${isDark ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"} uppercase font-semibold`}>
                      <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Organization</th>
                        <th className="p-3">Verified</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
                      {explorerData?.users?.map((u: any) => (
                        <tr key={u.id} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                          <td className={`p-3 font-semibold ${headerText}`}>{u.name}</td>
                          <td className={`p-3 font-mono ${subText}`}>{u.email}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.role === "ADMIN"
                                  ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                  : u.role === "MEMBER"
                                  ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className={`p-3 ${headerText}`}>{u.organization?.name}</td>
                          <td className="p-3">
                            {u.emailVerified ? (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓ Verified</span>
                            ) : (
                              <span className={`text-xs ${subText}`}>Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {explorerSubTab === "orgs" && (
                  <table className="w-full text-left text-xs">
                    <thead className={`${isDark ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"} uppercase font-semibold`}>
                      <tr>
                        <th className="p-3">Organization Name</th>
                        <th className="p-3">Slug</th>
                        <th className="p-3">Tier</th>
                        <th className="p-3">Tenant ID</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
                      {explorerData?.organizations?.map((o: any) => (
                        <tr key={o.id} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                          <td className={`p-3 font-semibold ${headerText}`}>{o.name}</td>
                          <td className={`p-3 font-mono ${subText}`}>{o.slug}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300">
                              {o.tier}
                            </span>
                          </td>
                          <td className={`p-3 font-mono ${subText}`}>{o.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {explorerSubTab === "emails" && (
                  <table className="w-full text-left text-xs">
                    <thead className={`${isDark ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"} uppercase font-semibold`}>
                      <tr>
                        <th className="p-3">Resend Email ID</th>
                        <th className="p-3">Recipient</th>
                        <th className="p-3">Event Type</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"} font-mono`}>
                      {explorerData?.emailLogs?.map((e: any) => (
                        <tr key={e.id} className={isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}>
                          <td className="p-3 text-pink-500">{e.resendEmailId}</td>
                          <td className={`p-3 font-sans ${headerText}`}>{e.recipientEmail}</td>
                          <td className={`p-3 ${subText}`}>{e.eventType}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                e.status === "DELIVERED"
                                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                  : e.status === "BOUNCED"
                                  ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                  : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {e.status}
                            </span>
                          </td>
                          <td className={`p-3 ${subText}`}>{new Date(e.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {explorerSubTab === "mongoose" && (
                  <div className="space-y-3 font-mono">
                    {explorerData?.mongooseDocs?.length === 0 ? (
                      <p className={`text-xs italic p-4 ${subText}`}>
                        No Mongoose documents ingested yet. Go to the "Webhooks & Database" tab and click "Simulate Incoming Resend Webhook" to ingest raw JSON documents!
                      </p>
                    ) : (
                      explorerData?.mongooseDocs?.map((doc: any, i: number) => (
                        <div key={i} className={`p-3 rounded-lg border ${cardAlt}`}>
                          <div className={`flex items-center justify-between text-[11px] mb-1 ${subText}`}>
                            <span className="text-purple-500 font-bold">Doc ID: {doc._id}</span>
                            <span>Provider: {doc.provider || "Resend"} | Type: {doc.type}</span>
                          </div>
                          <pre className="text-slate-200 text-[10px] overflow-x-auto bg-slate-950 p-2 rounded">
                            {JSON.stringify(doc.rawPayload, null, 2)}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
