"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Search, Shield, Trash2, ChevronRight,
  CheckCircle2, Clock, XCircle, UserMinus
} from "lucide-react";
import { api, type Employee } from "@/lib/api";

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function StatusBadge({ status }: { status: Employee["status"] }) {
  const map = {
    active: "status-active",
    offboarding: "status-pending",
    offboarded: "status-skipped",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[status]}`}>
      {status}
    </span>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "offboarded">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [offboarding, setOffboarding] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [form, setForm] = useState({ name: "", email: "", department: "", role: "" });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.department || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || e.status === filter;
    return matchSearch && matchFilter;
  });

  const handleAdd = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setAdding(true);
    try {
      await api.createEmployee(form);
      setForm({ name: "", email: "", department: "", role: "" });
      setShowAdd(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add employee");
    } finally {
      setAdding(false);
    }
  };

  const handleOffboard = async (emp: Employee) => {
    if (!confirm(`Revoke all SaaS access for ${emp.name}?`)) return;
    setOffboarding(emp.id);
    try {
      await api.triggerOffboard(emp.email);
      setTimeout(load, 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Offboarding failed");
    } finally {
      setOffboarding(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this employee record?")) return;
    setDeletingId(id);
    try {
      await api.deleteEmployee(id);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const active = employees.filter((e) => e.status === "active").length;
  const offboarded = employees.filter((e) => e.status === "offboarded").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-sm text-slate-400 mt-1">
            {active} active · {offboarded} offboarded
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl">
          {error}
        </div>
      )}

      {/* Add Employee form */}
      {showAdd && (
        <div className="glass-card rounded-2xl p-5 border border-blue-500/20">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" />
            New Employee
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
            {[
              { key: "name", label: "Full Name", required: true },
              { key: "email", label: "Work Email", required: true },
              { key: "department", label: "Department", required: false },
              { key: "role", label: "Role / Title", required: false },
            ].map(({ key, label, required }) => (
              <div key={key}>
                <label className="text-xs text-slate-400 mb-1 block">{label}</label>
                <input
                  type={key === "email" ? "email" : "text"}
                  required={required}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            ))}
            <div className="col-span-2 flex gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {adding && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Add Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(["all", "active", "offboarded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Employee table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              {["Employee", "Department", "Status", "Added", ""].map((h) => (
                <th key={h} className="text-left text-xs text-slate-500 font-medium px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton w-full h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-all group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{emp.name}</p>
                          <p className="text-xs text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{emp.department || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{relativeTime(emp.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        {emp.status === "active" && (
                          <button
                            onClick={() => handleOffboard(emp)}
                            disabled={offboarding === emp.id}
                            title="Offboard employee"
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                          >
                            {offboarding === emp.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin block" />
                            ) : (
                              <UserMinus className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(emp.id)}
                          disabled={deletingId === emp.id}
                          title="Remove record"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/dashboard/audit?employeeId=${emp.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                          title="View audit log"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No employees found</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {!loading && (
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Active</div>
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> Offboarding</div>
          <div className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-slate-400" /> Offboarded</div>
          <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-rose-400" /> Hover a row to offboard</div>
        </div>
      )}
    </div>
  );
}
