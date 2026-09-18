"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Download, Search, CheckCircle2, XCircle,
  Activity, Clock, Filter, ChevronLeft, ChevronRight
} from "lucide-react";
import { api, type OffboardingEvent } from "@/lib/api";

const PAGE_SIZE = 20;

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

function durationSecs(event: OffboardingEvent) {
  if (!event.completedAt) return null;
  return Math.round(
    (new Date(event.completedAt).getTime() - new Date(event.triggeredAt).getTime()) / 1000
  );
}

function StatusPill({ status }: { status: OffboardingEvent["status"] }) {
  const map: Record<string, string> = {
    completed: "status-success",
    partial: "status-pending",
    in_progress: "status-active",
    failed: "status-failed",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] || "status-skipped"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function RevBadge({ integration, status }: { integration: string; status: string }) {
  const icons: Record<string, React.ElementType> = {
    success: CheckCircle2,
    failed: XCircle,
    pending: Activity,
    skipped: Clock,
  };
  const Icon = icons[status] || Activity;
  const color: Record<string, string> = {
    success: "text-emerald-400",
    failed: "text-rose-400",
    pending: "text-amber-400",
    skipped: "text-slate-400",
  };
  return (
    <span className={`flex items-center gap-1 text-xs ${color[status] || "text-slate-400"}`}>
      <Icon className="w-3 h-3" />
      {integration}
    </span>
  );
}

export default function AuditPage() {
  const [events, setEvents] = useState<OffboardingEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditEvents({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setEvents(data.events);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? events.filter(
        (e) =>
          e.employee.name.toLowerCase().includes(search.toLowerCase()) ||
          e.employee.email.toLowerCase().includes(search.toLowerCase())
      )
    : events;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-sm text-slate-400 mt-1">
            {total} offboarding events — SOC 2 / ISO 27001 ready
          </p>
        </div>
        <a
          href={api.exportAuditCsv()}
          download="secureonboard-audit.csv"
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
        </div>

        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {[
            { value: "", label: "All" },
            { value: "completed", label: "Completed" },
            { value: "partial", label: "Partial" },
            { value: "in_progress", label: "In Progress" },
            { value: "failed", label: "Failed" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === value ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              {["Employee", "Triggered", "Duration", "Status", "Revocations", "Triggered By"].map((h) => (
                <th key={h} className="text-left text-xs text-slate-500 font-medium px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton w-full h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : filtered.map((event) => {
                  const secs = durationSecs(event);
                  return (
                    <tr key={event.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-all">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{event.employee.name}</p>
                        <p className="text-xs text-slate-400">{event.employee.email}</p>
                        {event.employee.department && (
                          <p className="text-xs text-slate-500">{event.employee.department}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {relativeTime(event.triggeredAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                        {secs !== null ? (
                          <span className={secs < 60 ? "text-emerald-400" : "text-amber-400"}>
                            {secs}s
                          </span>
                        ) : (
                          <span className="text-slate-500 animate-pulse">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={event.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {event.revocations.map((r) => (
                            <RevBadge key={r.id} integration={r.integration} status={r.status} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                          {event.triggeredBy}
                        </span>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No events found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page + 1} of {totalPages} · {total} events
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
