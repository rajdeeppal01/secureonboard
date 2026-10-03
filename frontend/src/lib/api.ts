/**
 * SecureOnboard API Client
 * Typed wrapper around the Express backend.
 * Sends Clerk JWT on every request via Authorization header.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, token: string | null, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface Revocation {
  id: string;
  integration: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  revokedAt: string | null;
  errorMessage: string | null;
}

export interface OffboardingEvent {
  id: string;
  triggeredAt: string;
  completedAt: string | null;
  status: 'in_progress' | 'completed' | 'partial' | 'failed';
  triggeredBy: string;
  employee: { name: string; email: string; department: string | null };
  revocations: Revocation[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: string | null;
  status: 'active' | 'offboarding' | 'offboarded';
  offboardedAt: string | null;
  createdAt: string;
  events: OffboardingEvent[];
}

export interface Integration {
  id: string;
  type: string;
  name: string;
  isConnected: boolean;
  hasCredentials: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditStats {
  totalEmployees: number;
  activeEmployees: number;
  offboardedEmployees: number;
  totalOffboardingEvents: number;
  avgRevocationSeconds: number;
}

export interface AuditListResponse {
  events: OffboardingEvent[];
  total: number;
  limit: number;
  offset: number;
}

// ── API factory — call makeApi(token) in each component using useAuth() ────

export function makeApi(token: string | null) {
  const r = <T>(path: string, options?: RequestInit) => request<T>(path, token, options);

  return {
    // Dashboard stats
    getStats: () =>
      r<AuditStats>('/api/audit/stats'),

    // Audit log
    getAuditEvents: (params?: { limit?: number; offset?: number; status?: string }) => {
      const p = new URLSearchParams();
      if (params?.limit) p.set('limit', String(params.limit));
      if (params?.offset) p.set('offset', String(params.offset));
      if (params?.status) p.set('status', params.status);
      const qs = p.toString();
      return r<AuditListResponse>(`/api/audit${qs ? '?' + qs : ''}`);
    },

    exportAuditCsvUrl: () => `${BASE}/api/audit/export?format=csv`,

    // Employees
    getEmployees: () =>
      r<Employee[]>('/api/employees'),

    createEmployee: (data: { name: string; email: string; department?: string; role?: string }) =>
      r<Employee>('/api/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteEmployee: (id: string) =>
      r<{ success: boolean }>(`/api/employees/${id}`, { method: 'DELETE' }),

    // Integrations
    getIntegrations: () =>
      r<Integration[]>('/api/integrations'),

    connectIntegration: (type: string, name: string, accessToken: string) =>
      r<Integration>('/api/integrations', {
        method: 'POST',
        body: JSON.stringify({ type, name, accessToken }),
      }),

    disconnectIntegration: (id: string) =>
      r<{ success: boolean }>(`/api/integrations/${id}`, { method: 'DELETE' }),

    testIntegration: (id: string) =>
      r<{ success: boolean; testedAt: string }>(`/api/integrations/${id}/test`, { method: 'POST' }),

    // Offboarding
    triggerOffboard: (employeeEmail: string) =>
      r<{ message: string; eventId: string; employee: { name: string; email: string }; integrationsQueued: number }>(
        '/api/webhooks/offboard',
        {
          method: 'POST',
          body: JSON.stringify({ employeeEmail, source: 'manual' }),
        }
      ),

    // Health
    health: () => r<{ status: string; timestamp: string }>('/health'),
  };
}

// Backwards-compat alias for any existing usages (unauthenticated)
export const api = makeApi(null);

