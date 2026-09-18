/**
 * SecureOnboard API Client
 * Typed wrapper around the Express backend.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || 'demo-org-id';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
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

// ── API Calls ─────────────────────────────────────────────────────────────

export const api = {
  // Dashboard stats
  getStats: () =>
    request<AuditStats>(`/api/audit/stats?orgId=${ORG_ID}`),

  // Audit log
  getAuditEvents: (params?: { limit?: number; offset?: number; status?: string }) => {
    const p = new URLSearchParams({ orgId: ORG_ID });
    if (params?.limit) p.set('limit', String(params.limit));
    if (params?.offset) p.set('offset', String(params.offset));
    if (params?.status) p.set('status', params.status);
    return request<AuditListResponse>(`/api/audit?${p}`);
  },

  exportAuditCsv: () => `${BASE}/api/audit/export?orgId=${ORG_ID}&format=csv`,

  // Employees
  getEmployees: () =>
    request<Employee[]>(`/api/employees?orgId=${ORG_ID}`),

  createEmployee: (data: { name: string; email: string; department?: string; role?: string }) =>
    request<Employee>('/api/employees', {
      method: 'POST',
      body: JSON.stringify({ ...data, organizationId: ORG_ID }),
    }),

  deleteEmployee: (id: string) =>
    request<{ success: boolean }>(`/api/employees/${id}`, { method: 'DELETE' }),

  // Integrations
  getIntegrations: () =>
    request<Integration[]>(`/api/integrations?orgId=${ORG_ID}`),

  connectIntegration: (type: string, name: string, accessToken: string) =>
    request<Integration>('/api/integrations', {
      method: 'POST',
      body: JSON.stringify({ type, name, accessToken, organizationId: ORG_ID }),
    }),

  disconnectIntegration: (id: string) =>
    request<{ success: boolean }>(`/api/integrations/${id}`, { method: 'DELETE' }),

  testIntegration: (id: string) =>
    request<{ success: boolean; testedAt: string }>(`/api/integrations/${id}/test`, { method: 'POST' }),

  // Offboarding
  triggerOffboard: (employeeEmail: string) =>
    request<{ message: string; eventId: string; employee: { name: string; email: string }; integrationsQueued: number }>(
      '/api/webhooks/offboard',
      {
        method: 'POST',
        body: JSON.stringify({ employeeEmail, organizationId: ORG_ID, source: 'manual' }),
      }
    ),

  // Health
  health: () => request<{ status: string; timestamp: string }>('/health'),
};
