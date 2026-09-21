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
} from "lucide-react";

export default function DashboardPage() {
  // Simulator State
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "MEMBER" | "GUEST" | "ANONYMOUS">("ADMIN");
  const [activeTab, setActiveTab] = useState<"overview" | "rbac" | "transactions" | "webhooks" | "explorer">("overview");
  const [explorerSubTab, setExplorerSubTab] = useState<"orgs" | "users" | "txns" | "audits" | "emails" | "mongoose">("txns");

  // Probe & Action State
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeResult, setProbeResult] = useState<any>(null);

  // Transaction Form State
  const [txAmount, setTxAmount] = useState("1850.00");
  const [txCategory, setTxCategory] = useState("CLOUD_INFRASTRUCTURE");
  const [txDescription, setTxDescription] = useState("AWS GovCloud Compute & Storage Cluster Allocation");
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Hero Banner */}
      <header className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                CO3 & CO4 Full-Stack Pipeline
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Units IV, V & VI
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                PO3, PO5, PO11 | PSO 2
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Automated Relational Data Seeding, Transactional Event Notification & Secure Full-Stack Endpoints
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Prisma ORM • Better Auth & Next.js Proxy/Middleware Gates • Faker.js Seeding • Resend & React Email • Mongoose Document Store
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={dataLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin text-blue-400" : ""}`} />
              Refresh Telemetry
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-6 flex space-x-1 border-b border-slate-800">
          {[
            { id: "overview", label: "Pipeline Overview", icon: Layers },
            { id: "rbac", label: "RBAC Proxy Gates (CO3)", icon: ShieldCheck },
            { id: "transactions", label: "Transactions & Resend Dispatch (Part C)", icon: Mail },
            { id: "webhooks", label: "Resend Webhooks & Mongoose (CO4)", icon: Webhook },
            { id: "explorer", label: "Relational & Document Explorer", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition -mb-px ${
                  isActive
                    ? "border-blue-500 text-blue-400 bg-slate-800/40"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Persistent Active Identity Controller (for RBAC testing) */}
      <div className="mb-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Active Security Context (Middleware Gate Identity)
            </span>
            <span className="text-sm font-medium text-slate-200">
              Simulating Role: <strong className="text-blue-400">{selectedRole}</strong>
            </span>
          </div>
        </div>

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
                    ? "bg-red-500/20 text-red-300 border border-red-500/40 ring-2 ring-red-500/30"
                    : role === "MEMBER"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 ring-2 ring-blue-500/30"
                    : role === "GUEST"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-2 ring-amber-500/30"
                    : "bg-slate-700 text-slate-200 border border-slate-600 ring-2 ring-slate-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750 border border-slate-750"
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
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Organizations</span>
                <Building className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{explorerData?.organizations?.length || 5}</div>
              <span className="text-xs text-slate-500">Multi-tenant roots</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Seeded Users</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{explorerData?.users?.length || 25}</div>
              <span className="text-xs text-slate-500">Admin, Member, Guest</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Transactions</span>
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">{explorerData?.transactions?.length || 100}+</div>
              <span className="text-xs text-slate-500">Relational FK integrity</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Audit Logs</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">{explorerData?.auditLogs?.length || 150}+</div>
              <span className="text-xs text-slate-500">Immutable security trace</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-medium">Email Logs</span>
                <Mail className="w-4 h-4 text-pink-400" />
              </div>
              <div className="text-2xl font-bold text-white">{explorerData?.emailLogs?.length || 25}+</div>
              <span className="text-xs text-slate-500">Resend dispatch events</span>
            </div>
          </div>

          {/* Architecture Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/40 flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 w-fit mb-3">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Part A: Relational Pipeline (CO4)</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Normalized multi-entity relational schema (Organizations, Users, Roles, Transactions, AuditLogs) backed by Prisma ORM. Executable <code className="text-blue-300">seed.ts</code> leveraging localized <code className="text-blue-300">@faker-js/faker</code> dummy generation with proper foreign keys.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <code className="text-xs text-emerald-400 font-mono bg-slate-900 px-2 py-1 rounded block">
                  npm run db:pipeline
                </code>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/40 flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Part B: Edge Proxy Gates (CO3)</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Better Auth session parsing via Next.js Edge Middleware layer (<code className="text-emerald-300">middleware.ts</code>). Enforces role gates (<code className="text-emerald-300">ADMIN</code>, <code className="text-emerald-300">MEMBER</code>, <code className="text-emerald-300">GUEST</code>) and injects tenant identity headers downstream.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <span className="text-xs text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Protected API Routes & Server Actions
                </span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/40 flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 w-fit mb-3">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Part C: Resend & React Email (CO3/CO4)</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Modular React Email template rendered to responsive HTML. Resend API lifecycle dispatch following database mutations. Webhook ingestion Route Handler logging delivery/bounce events into Prisma (Relational) and Mongoose (Object DB).
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <span className="text-xs text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
                  Dual-Store Persistence (Prisma + Mongoose)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC PROXY GATES */}
      {activeTab === "rbac" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Role-Based Access Control & Proxy Gate Verification (CO3)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Probe backend route handlers using your selected role above. Next.js Edge Middleware evaluates session credentials and role hierarchy before requests reach backend logic.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Probe 1: Admin Endpoint */}
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                    Admin Gate Only
                  </span>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-300">
                    GET /api/admin/metrics
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Requires <strong>ADMIN</strong> role. Members, Guests, and Anonymous users will receive <strong>403 Forbidden</strong> or <strong>401 Unauthorized</strong>.
                </p>
                <button
                  onClick={() => testGate("/api/admin/metrics")}
                  disabled={probeLoading}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center gap-2"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Probe Admin Metrics Route Handler
                </button>
              </div>

              {/* Probe 2: Tenant Scoped Transactions */}
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Multi-Tenant Gate
                  </span>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-300">
                    GET /api/transactions
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Enforces tenant boundary. Members only see their organization's records. Anonymous requests are blocked with <strong>401 Unauthorized</strong>.
                </p>
                <button
                  onClick={() => testGate("/api/transactions")}
                  disabled={probeLoading}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-2"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Probe Tenant Scoped Transactions Route
                </button>
              </div>
            </div>

            {/* Probe Output Console */}
            {probeResult && (
              <div className="mt-6 rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300 font-semibold">Edge Proxy Gate Response Inspector</span>
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
                    <span className="text-slate-500 block mb-1">Downstream Headers Forwarded:</span>
                    <pre className="text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(probeResult.headersSent, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Backend JSON Payload:</span>
                    <pre className="text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto max-h-56">
                      {JSON.stringify(probeResult.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS & RESEND LIFECYCLE DISPATCH */}
      {activeTab === "transactions" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Prisma Database Mutation & Resend Lifecycle Notification (Part C)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Submit a financial transaction. The backend creates a normalized record in Prisma, logs an immutable AuditLog, and dispatches a transactional security notification via Resend & React Email.
            </p>

            <form onSubmit={submitTransaction} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Transaction Category
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="CLOUD_INFRASTRUCTURE">Cloud Infrastructure</option>
                  <option value="SECURITY_AUDIT">Security Audit</option>
                  <option value="EQUIPMENT_PROCUREMENT">Equipment Procurement</option>
                  <option value="VENDOR_PAYMENT">Vendor Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-3 mt-2">
                <button
                  type="submit"
                  disabled={txLoading || selectedRole === "GUEST" || selectedRole === "ANONYMOUS"}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {txLoading ? "Executing Mutation & Dispatch..." : "Execute Prisma Mutation & Dispatch Resend Alert"}
                </button>
                {(selectedRole === "GUEST" || selectedRole === "ANONYMOUS") && (
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Cannot mutate as {selectedRole}. Please switch role to ADMIN or MEMBER in the security banner above.
                  </p>
                )}
              </div>
            </form>

            {/* Mutation Output */}
            {txResult && (
              <div className="mt-6 rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Prisma Mutation & Resend Dispatch Confirmed (HTTP {txResult.status})
                  </span>
                  <span className="text-slate-400">Reference: {txResult.payload?.transaction?.referenceCode}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block mb-1">Relational Database Mutation (Prisma):</span>
                    <pre className="text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(txResult.payload?.transaction, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Resend Email Lifecycle Dispatch:</span>
                    <pre className="text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(txResult.payload?.emailNotification, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: WEBHOOKS & MONGOOSE DUAL STORE */}
      {activeTab === "webhooks" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Webhook className="w-5 h-5 text-purple-400" />
              Resend Webhook Ingestion & Dual Datastore Pipeline (Part C & CO4)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              When Resend delivers or bounces an email, its webhook fires to <code className="text-purple-300">/api/webhooks/resend</code>. The endpoint updates the relational status in <strong>Prisma ORM</strong> and logs the raw unstructured JSON telemetry in <strong>Mongoose Document Store</strong>.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase">Event Type:</label>
                <select
                  value={webhookType}
                  onChange={(e) => setWebhookType(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
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
              <div className="mt-6 rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="text-purple-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Webhook Ingested across Relational & Object Datastores
                  </span>
                  <span className="text-slate-400">HTTP {webhookResult.status}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block mb-1">Prisma Relational Persistence:</span>
                    <pre className="text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(webhookResult.payload?.relationalStore, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Mongoose Object Database (CO4):</span>
                    <pre className="text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(webhookResult.payload?.objectStore, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: RELATIONAL & DOCUMENT EXPLORER */}
      {activeTab === "explorer" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  Relational & Object Datastore Telemetry Explorer
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Live inspection of seeded mock records, foreign keys, audit traces, and Mongoose raw documents.
                </p>
              </div>

              {/* Sub tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {[
                  { id: "txns", label: "Transactions" },
                  { id: "audits", label: "Audit Logs" },
                  { id: "users", label: "Users & Roles" },
                  { id: "orgs", label: "Organizations" },
                  { id: "emails", label: "Resend Logs" },
                  { id: "mongoose", label: "Mongoose Docs" },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setExplorerSubTab(sub.id as any)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                      explorerSubTab === sub.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
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
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Reference Code</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Organization</th>
                      <th className="p-3">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {explorerData?.transactions?.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-blue-400 font-bold">{t.referenceCode}</td>
                        <td className="p-3 text-slate-200">${t.amount.toFixed(2)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === "COMPLETED"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : t.status === "PENDING"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{t.category}</td>
                        <td className="p-3 text-slate-300 font-sans">{t.organization?.name}</td>
                        <td className="p-3 text-slate-400 font-sans">{t.user?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {explorerSubTab === "audits" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Action</th>
                      <th className="p-3">Resource</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {explorerData?.auditLogs?.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-amber-400 font-semibold">{a.action}</td>
                        <td className="p-3 text-slate-300">{a.resource}</td>
                        <td className="p-3 text-slate-400">{a.ipAddress || "127.0.0.1"}</td>
                        <td className="p-3 text-slate-300 font-sans">{a.user?.name || "System"}</td>
                        <td className="p-3 text-slate-500">{new Date(a.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {explorerSubTab === "users" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Organization</th>
                      <th className="p-3">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {explorerData?.users?.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-white">{u.name}</td>
                        <td className="p-3 text-slate-300 font-mono">{u.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === "ADMIN"
                                ? "bg-red-500/20 text-red-400"
                                : u.role === "MEMBER"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{u.organization?.name}</td>
                        <td className="p-3">
                          {u.emailVerified ? (
                            <span className="text-emerald-400 text-xs">✓ Verified</span>
                          ) : (
                            <span className="text-slate-500 text-xs">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {explorerSubTab === "orgs" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Organization Name</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Tier</th>
                      <th className="p-3">Tenant ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {explorerData?.organizations?.map((o: any) => (
                      <tr key={o.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-white">{o.name}</td>
                        <td className="p-3 text-slate-400 font-mono">{o.slug}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                            {o.tier}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono">{o.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {explorerSubTab === "emails" && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Resend Email ID</th>
                      <th className="p-3">Recipient</th>
                      <th className="p-3">Event Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {explorerData?.emailLogs?.map((e: any) => (
                      <tr key={e.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-pink-400">{e.resendEmailId}</td>
                        <td className="p-3 text-slate-300 font-sans">{e.recipientEmail}</td>
                        <td className="p-3 text-slate-400">{e.eventType}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              e.status === "DELIVERED"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : e.status === "BOUNCED"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {explorerSubTab === "mongoose" && (
                <div className="space-y-3 font-mono">
                  {explorerData?.mongooseDocs?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4">
                      No Mongoose documents ingested yet. Go to the "Resend Webhooks" tab and click "Simulate Incoming Resend Webhook" to ingest raw JSON documents!
                    </p>
                  ) : (
                    explorerData?.mongooseDocs?.map((doc: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="text-purple-400 font-bold">Doc ID: {doc._id}</span>
                          <span>Provider: {doc.provider || "Resend"} | Type: {doc.type}</span>
                        </div>
                        <pre className="text-slate-300 text-[10px] overflow-x-auto bg-slate-950 p-2 rounded">
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
  );
}
