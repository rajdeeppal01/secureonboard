"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plug, CheckCircle2, XCircle, RefreshCw,
  Trash2, Plus, Zap, AlertTriangle
} from "lucide-react";
import { api, type Integration } from "@/lib/api";

const INTEGRATION_META: Record<string, { label: string; description: string; docsUrl: string; color: string; initials: string }> = {
  google: {
    label: "Google Workspace",
    description: "Suspend user accounts, revoke OAuth sessions and transfer Drive ownership on offboarding.",
    docsUrl: "https://developers.google.com/admin-sdk/directory",
    color: "from-blue-500 to-cyan-500",
    initials: "G",
  },
  slack: {
    label: "Slack",
    description: "Deactivate user accounts and revoke all active sessions across workspaces.",
    docsUrl: "https://api.slack.com/methods/admin.users.setInactive",
    color: "from-purple-500 to-pink-500",
    initials: "S",
  },
  github: {
    label: "GitHub",
    description: "Remove org membership, revoke personal access tokens, and transfer repositories.",
    docsUrl: "https://docs.github.com/en/rest/orgs/members",
    color: "from-slate-500 to-slate-700",
    initials: "GH",
  },
  notion: {
    label: "Notion",
    description: "Deactivate workspace members and revoke page access. Coming soon.",
    docsUrl: "#",
    color: "from-zinc-500 to-zinc-700",
    initials: "N",
  },
  figma: {
    label: "Figma",
    description: "Remove team members and revoke design file access. Coming soon.",
    docsUrl: "#",
    color: "from-rose-500 to-orange-500",
    initials: "F",
  },
  aws: {
    label: "AWS IAM",
    description: "Disable IAM users, revoke access keys and remove group memberships. Coming soon.",
    docsUrl: "#",
    color: "from-orange-500 to-yellow-500",
    initials: "AWS",
  },
};

const COMING_SOON = ["notion", "figma", "aws"];

function IntegrationCard({
  integration,
  onDisconnect,
  onTest,
}: {
  integration: Integration;
  onDisconnect: (id: string) => void;
  onTest: (id: string) => void;
}) {
  const meta = INTEGRATION_META[integration.type] || {
    label: integration.name,
    description: "",
    docsUrl: "#",
    color: "from-slate-500 to-slate-700",
    initials: integration.type.charAt(0).toUpperCase(),
  };
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await onTest(integration.id);
    setTesting(false);
  };

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect ${meta.label}? Offboarding will skip this integration.`)) return;
    setDisconnecting(true);
    await onDisconnect(integration.id);
    setDisconnecting(false);
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
            {meta.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{meta.label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {integration.isConnected ? (
                <>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full pulse-dot" />
                  <span className="text-xs text-emerald-400">Connected</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                  <span className="text-xs text-slate-400">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
        {integration.lastTestStatus && (
          integration.lastTestStatus === "success"
            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        )}
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">{meta.description}</p>

      {integration.lastTestedAt && (
        <p className="text-xs text-slate-500">
          Last tested: {new Date(integration.lastTestedAt).toLocaleString()}
        </p>
      )}

      <div className="flex gap-2 mt-auto">
        <button
          onClick={handleTest}
          disabled={testing || !integration.isConnected}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all disabled:opacity-40"
        >
          {testing ? (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Test
        </button>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-all disabled:opacity-40"
        >
          {disconnecting ? (
            <span className="w-3 h-3 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          Disconnect
        </button>
      </div>
    </div>
  );
}

function ComingSoonCard({ type }: { type: string }) {
  const meta = INTEGRATION_META[type];
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 opacity-60">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-xs font-bold text-white`}>
          {meta.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{meta.label}</p>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">Coming soon</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{meta.description}</p>
      <button disabled className="w-full py-2 text-xs font-medium text-slate-500 bg-slate-800/50 rounded-lg cursor-not-allowed">
        Not available yet
      </button>
    </div>
  );
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [connectForm, setConnectForm] = useState({ type: "google", name: "", token: "" });
  const [connecting, setConnecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDisconnect = async (id: string) => {
    try {
      await api.disconnectIntegration(id);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Disconnect failed");
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await api.testIntegration(id);
      if (!result.success) setError("Integration test failed — check your credentials");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Test failed");
    }
  };

  const handleConnect = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setConnecting(true);
    try {
      await api.connectIntegration(connectForm.type, connectForm.name || connectForm.type, connectForm.token);
      setShowConnect(false);
      setConnectForm({ type: "google", name: "", token: "" });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const connected = integrations.filter((i) => i.isConnected);
  const disconnected = integrations.filter((i) => !i.isConnected);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-sm text-slate-400 mt-1">
            {connected.length} connected · manage SaaS access revocation
          </p>
        </div>
        <button
          onClick={() => setShowConnect(!showConnect)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Connect Integration
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Connect form */}
      {showConnect && (
        <div className="glass-card rounded-2xl p-5 border border-blue-500/20">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Plug className="w-4 h-4 text-blue-400" />
            Connect Integration
          </h2>
          <form onSubmit={handleConnect} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Integration Type</label>
                <select
                  value={connectForm.type}
                  onChange={(e) => setConnectForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="google">Google Workspace</option>
                  <option value="slack">Slack</option>
                  <option value="github">GitHub</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Display Name (optional)</label>
                <input
                  type="text"
                  placeholder={INTEGRATION_META[connectForm.type]?.label || ""}
                  value={connectForm.name}
                  onChange={(e) => setConnectForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Access Token / API Key</label>
              <input
                type="password"
                required
                placeholder="Paste your API key or access token"
                value={connectForm.token}
                onChange={(e) => setConnectForm((f) => ({ ...f, token: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowConnect(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all">
                Cancel
              </button>
              <button
                type="submit"
                disabled={connecting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {connecting && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Connect
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Connected integrations */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          Active Integrations
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex gap-3">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <div className="skeleton w-32 h-4 rounded" />
                    <div className="skeleton w-20 h-3 rounded" />
                  </div>
                </div>
                <div className="skeleton w-full h-10 rounded-lg" />
              </div>
            ))}
          </div>
        ) : connected.length === 0 && disconnected.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
            <Plug className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No integrations configured</p>
            <p className="text-xs mt-1">Click "Connect Integration" to add one</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connected.map((i) => (
              <IntegrationCard key={i.id} integration={i} onDisconnect={handleDisconnect} onTest={handleTest} />
            ))}
            {disconnected.map((i) => (
              <IntegrationCard key={i.id} integration={i} onDisconnect={handleDisconnect} onTest={handleTest} />
            ))}
          </div>
        )}
      </div>

      {/* Coming soon */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMING_SOON.map((type) => (
            <ComingSoonCard key={type} type={type} />
          ))}
        </div>
      </div>
    </div>
  );
}
