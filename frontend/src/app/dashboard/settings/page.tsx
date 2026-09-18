"use client";

import { useState } from "react";
import { Settings, Copy, Check, Eye, EyeOff, Shield, Bell, Key, Globe } from "lucide-react";
import { ORG_ID } from "@/lib/api";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function SecretField({ value, label }: { value: string; label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5">
        <input
          readOnly
          type={visible ? "text" : "password"}
          value={value}
          className="flex-1 bg-transparent text-sm text-white font-mono focus:outline-none"
        />
        <button
          onClick={() => setVisible(!visible)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [orgName, setOrgName] = useState("Acme Corp");
  const [domain, setDomain] = useState("acme.com");
  const [hrisType, setHrisType] = useState("manual");
  const [notifications, setNotifications] = useState({
    offboardComplete: true,
    offboardFailed: true,
    orphanedAccounts: false,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/webhooks/bamboohr`;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your organization and security preferences</p>
      </div>

      {/* Organization */}
      <div className="glass-card rounded-2xl p-5 space-y-5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          Organization
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Organization Name</label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Domain</label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">HRIS System</label>
            <select
              value={hrisType}
              onChange={(e) => setHrisType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="manual">Manual (Dashboard / API)</option>
              <option value="bamboohr">BambooHR</option>
              <option value="rippling">Rippling</option>
              <option value="workday">Workday</option>
            </select>
            <p className="text-xs text-slate-500 mt-1.5">
              Determines how employee termination events are received.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              {saved && <Check className="w-4 h-4 text-emerald-300" />}
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* API & Webhooks */}
      <div className="glass-card rounded-2xl p-5 space-y-5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-violet-400" />
          API & Webhooks
        </h2>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Organization ID</label>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5">
            <code className="flex-1 text-sm text-violet-300 font-mono">{ORG_ID}</code>
            <CopyButton text={ORG_ID} />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Pass as <code className="text-slate-400">organizationId</code> in API requests.
          </p>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Webhook Endpoint (HRIS)</label>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5">
            <code className="flex-1 text-xs text-slate-300 font-mono break-all">{webhookUrl}</code>
            <CopyButton text={webhookUrl} />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Configure this URL in BambooHR / Rippling to auto-trigger offboarding on termination.
          </p>
        </div>

        <SecretField
          label="Webhook Secret"
          value={process.env.NEXT_PUBLIC_WEBHOOK_SECRET || "secureonboard-dev-secret-change-in-prod"}
        />
      </div>

      {/* Notifications */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          Notifications
        </h2>

        {[
          { key: "offboardComplete" as const, label: "Offboarding completed", description: "Notify when all access is successfully revoked" },
          { key: "offboardFailed" as const, label: "Offboarding failed / partial", description: "Alert if any integration fails during offboarding" },
          { key: "orphanedAccounts" as const, label: "Orphaned accounts detected", description: "Weekly digest of accounts that may need review" },
        ].map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
            <div>
              <p className="text-sm text-white">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
            <button
              onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
              className={`relative w-10 h-6 rounded-full transition-all duration-200 ${
                notifications[key] ? "bg-blue-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  notifications[key] ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="glass-card rounded-2xl p-5 border border-rose-500/20 space-y-4">
        <h2 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Reset all integrations</p>
            <p className="text-xs text-slate-400 mt-0.5">Disconnect all SaaS tools. Offboarding will stop working until re-connected.</p>
          </div>
          <button
            onClick={() => alert("This would reset all integrations in production.")}
            className="text-xs text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
