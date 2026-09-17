"use client";

import { useState } from "react";
import {
  Shield, Users, Zap, Clock, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, Activity,
  TrendingUp, Lock
} from "lucide-react";

// ── Mock data ──────────────────────────────────────────────────────────────
const stats = [
  {
    label: "Protected Employees",
    value: "47",
    delta: "+3 this week",
    positive: true,
    icon: Users,
    color: "blue",
  },
  {
    label: "Active Integrations",
    value: "3",
    delta: "Google · Slack · GitHub",
    positive: true,
    icon: Zap,
    color: "violet",
  },
  {
    label: "Avg Revocation Time",
    value: "42s",
    delta: "↓ 8s from last month",
    positive: true,
    icon: Clock,
    color: "emerald",
  },
  {
    label: "Orphaned Accounts",
    value: "2",
    delta: "Action required",
    positive: false,
    icon: AlertTriangle,
    color: "rose",
  },
];

const recentEvents = [
  {
    id: "evt_01",
    employee: "Sarah Johnson",
    email: "sarah@acme.com",
    department: "Engineering",
    triggeredAt: "2 minutes ago",
    status: "completed",
    duration: "38s",
    revocations: [
      { app: "Google", status: "success" },
      { app: "Slack", status: "success" },
      { app: "GitHub", status: "success" },
    ],
  },
  {
    id: "evt_02",
    employee: "Mike Chen",
    email: "mike@acme.com",
    department: "Sales",
    triggeredAt: "1 hour ago",
    status: "partial",
    duration: "54s",
    revocations: [
      { app: "Google", status: "success" },
      { app: "Slack", status: "success" },
      { app: "GitHub", status: "failed" },
    ],
  },
  {
    id: "evt_03",
    employee: "Priya Sharma",
    email: "priya@acme.com",
    department: "Design",
    triggeredAt: "Yesterday",
    status: "completed",
    duration: "41s",
    revocations: [
      { app: "Google", status: "success" },
      { app: "Slack", status: "success" },
      { app: "GitHub", status: "success" },
    ],
  },
];

const integrationHealth = [
  { name: "Google Workspace", status: "connected", lastChecked: "1 min ago", color: "emerald" },
  { name: "Slack", status: "connected", lastChecked: "1 min ago", color: "emerald" },
  { name: "GitHub", status: "connected", lastChecked: "1 min ago", color: "emerald" },
];

// ── Color maps ─────────────────────────────────────────────────────────────
const colorMap: Record<string, string> = {
  blue: "from-blue-500 to-blue-700 shadow-blue-500/20",
  violet: "from-violet-500 to-purple-700 shadow-violet-500/20",
  emerald: "from-emerald-500 to-teal-700 shadow-emerald-500/20",
  rose: "from-rose-500 to-pink-700 shadow-rose-500/20",
};

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({
  label, value, delta, positive, icon: Icon, color,
}: (typeof stats)[0]) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-700 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <TrendingUp className={`w-4 h-4 ${positive ? "text-emerald-400" : "text-rose-400"} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{label}</p>
      </div>
      <p className={`text-xs font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}>
        {delta}
      </p>
    </div>
  );
}

function RevocationBadge({ app, status }: { app: string; status: string }) {
  if (status === "success") {
    return (
      <span className="flex items-center gap-1 text-xs status-success px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> {app}
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex items-center gap-1 text-xs status-failed px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> {app}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs status-pending px-2 py-0.5 rounded-full">
      <Activity className="w-3 h-3" /> {app}
    </span>
  );
}

// ── Main Dashboard Page ────────────────────────────────────────────────────
export default function DashboardPage() {
  const [offboardEmail, setOffboardEmail] = useState("");
  const [offboarding, setOffboarding] = useState(false);
  const [offboardResult, setOffboardResult] = useState<string | null>(null);

  const handleQuickOffboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setOffboarding(true);
    setOffboardResult(null);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setOffboarding(false);
    setOffboardResult(`✅ Offboarding initiated for ${offboardEmail}`);
    setOffboardEmail("");
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time access lifecycle monitoring
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot" />
          All systems operational
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent offboarding events */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Recent Offboarding Events
            </h2>
            <a href="/dashboard/audit" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-150"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{event.employee}</p>
                    <p className="text-xs text-slate-400">
                      {event.department} · {event.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        event.status === "completed"
                          ? "status-success"
                          : event.status === "partial"
                          ? "status-pending"
                          : "status-failed"
                      }`}
                    >
                      {event.status}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{event.triggeredAt} · {event.duration}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {event.revocations.map((r) => (
                    <RevocationBadge key={r.app} {...r} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick offboard */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-rose-400" />
              Quick Offboard
            </h2>
            <form onSubmit={handleQuickOffboard} className="space-y-3">
              <input
                type="email"
                placeholder="employee@company.com"
                value={offboardEmail}
                onChange={(e) => setOffboardEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={offboarding || !offboardEmail}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2"
              >
                {offboarding ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Offboarding...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Revoke All Access
                  </>
                )}
              </button>
              {offboardResult && (
                <p className="text-xs text-emerald-400 text-center">{offboardResult}</p>
              )}
            </form>
          </div>

          {/* Integration health */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-violet-400" />
              Integration Health
            </h2>
            <div className="space-y-3">
              {integrationHealth.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot" />
                    <span className="text-sm text-slate-300">{integration.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{integration.lastChecked}</span>
                </div>
              ))}
              <a
                href="/dashboard/integrations"
                className="flex items-center justify-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-3 transition-colors"
              >
                Manage integrations <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
