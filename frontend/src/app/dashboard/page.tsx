"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Users, Zap, Clock, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, Activity,
  TrendingUp, Lock, RefreshCw
} from "lucide-react";
import { api, type AuditStats, type OffboardingEvent } from "@/lib/api";

// ── Color maps ─────────────────────────────────────────────────────────────
const colorMap: Record<string, string> = {
  blue: "from-blue-500 to-blue-700 shadow-blue-500/20",
  violet: "from-violet-500 to-purple-700 shadow-violet-500/20",
  emerald: "from-emerald-500 to-teal-700 shadow-emerald-500/20",
  rose: "from-rose-500 to-pink-700 shadow-rose-500/20",
};

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
      <div className="skeleton w-10 h-10 rounded-xl" />
      <div className="space-y-2">
        <div className="skeleton w-16 h-7 rounded" />
        <div className="skeleton w-28 h-3 rounded" />
      </div>
      <div className="skeleton w-20 h-3 rounded" />
    </div>
  );
}

function StatCard({
  label, value, delta, positive, icon: Icon, color,
}: {
  label: string; value: string; delta: string; positive: boolean;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-700 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg`}>
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
  if (status === "success")
    return (
      <span className="flex items-center gap-1 text-xs status-success px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> {app}
      </span>
    );
  if (status === "failed")
    return (
      <span className="flex items-center gap-1 text-xs status-failed px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> {app}
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs status-pending px-2 py-0.5 rounded-full">
      <Activity className="w-3 h-3" /> {app}
    </span>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function durationLabel(event: OffboardingEvent) {
  if (!event.completedAt) return "in progress";
  const ms = new Date(event.completedAt).getTime() - new Date(event.triggeredAt).getTime();
  return `${Math.round(ms / 1000)}s`;
}

// ── Main Dashboard Page ────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [events, setEvents] = useState<OffboardingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offboardEmail, setOffboardEmail] = useState("");
  const [offboarding, setOffboarding] = useState(false);
  const [offboardResult, setOffboardResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, a] = await Promise.all([
        api.getStats(),
        api.getAuditEvents({ limit: 5 }),
      ]);
      setStats(s);
      setEvents(a.events);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleQuickOffboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setOffboarding(true);
    setOffboardResult(null);
    try {
      const res = await api.triggerOffboard(offboardEmail);
      setOffboardResult({ ok: true, msg: `✅ Offboarding initiated for ${res.employee.name} — ${res.integrationsQueued} integrations queued` });
      setOffboardEmail("");
      // Refresh data after a short delay
      setTimeout(load, 2000);
    } catch (err: unknown) {
      setOffboardResult({ ok: false, msg: `❌ ${err instanceof Error ? err.message : "Failed to offboard"}` });
    } finally {
      setOffboarding(false);
    }
  };

  // Build stat cards from real data
  const statCards = stats
    ? [
        {
          label: "Active Employees",
          value: String(stats.activeEmployees),
          delta: `${stats.totalEmployees} total`,
          positive: true,
          icon: Users,
          color: "blue",
        },
        {
          label: "Offboarding Events",
          value: String(stats.totalOffboardingEvents),
          delta: "All time",
          positive: true,
          icon: Zap,
          color: "violet",
        },
        {
          label: "Avg Revocation Time",
          value: `${stats.avgRevocationSeconds}s`,
          delta: "Target: <60s",
          positive: stats.avgRevocationSeconds < 60,
          icon: Clock,
          color: "emerald",
        },
        {
          label: "Offboarded",
          value: String(stats.offboardedEmployees),
          delta: "Fully revoked",
          positive: true,
          icon: AlertTriangle,
          color: "rose",
        },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time access lifecycle monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full">
              {error} — <button onClick={load} className="underline">retry</button>
            </p>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot" />
            All systems operational
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((s) => <StatCard key={s.label} {...s} />)}
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

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="skeleton w-32 h-4 rounded" />
                      <div className="skeleton w-48 h-3 rounded" />
                    </div>
                    <div className="skeleton w-16 h-5 rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <div className="skeleton w-20 h-5 rounded-full" />
                    <div className="skeleton w-16 h-5 rounded-full" />
                    <div className="skeleton w-18 h-5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No offboarding events yet</p>
              <p className="text-xs mt-1">Use the Quick Offboard form to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{event.employee.name}</p>
                      <p className="text-xs text-slate-400">
                        {event.employee.department} · {event.employee.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.status === "completed" ? "status-success"
                        : event.status === "partial" ? "status-pending"
                        : event.status === "in_progress" ? "status-active"
                        : "status-failed"
                      }`}>
                        {event.status}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {relativeTime(event.triggeredAt)} · {durationLabel(event)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {event.revocations.map((r) => (
                      <RevocationBadge key={r.id} app={r.integration} status={r.status} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                placeholder="employee@acme.com"
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
                <p className={`text-xs text-center ${offboardResult.ok ? "text-emerald-400" : "text-rose-400"}`}>
                  {offboardResult.msg}
                </p>
              )}
            </form>
          </div>

          {/* Integration health */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-violet-400" />
              Integration Health
            </h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="skeleton w-32 h-4 rounded" />
                    <div className="skeleton w-16 h-3 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Static for now; integrations page has live data */}
                {[
                  { name: "Google Workspace", ok: true },
                  { name: "Slack", ok: true },
                  { name: "GitHub", ok: true },
                ].map((i) => (
                  <div key={i.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full pulse-dot ${i.ok ? "bg-emerald-400" : "bg-rose-400"}`} />
                      <span className="text-sm text-slate-300">{i.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{i.ok ? "connected" : "error"}</span>
                  </div>
                ))}
                <a
                  href="/dashboard/integrations"
                  className="flex items-center justify-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-3 transition-colors"
                >
                  Manage integrations <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
