/**
 * In-memory mock data store for running without a PostgreSQL database.
 * Used when DATABASE_URL is not reachable.
 * Supports all the operations the routes need.
 */

import { randomUUID } from 'crypto';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MockOrg {
  id: string;
  name: string;
  domain: string;
  hrisType: string;
  webhookSecret: string;
}

export interface MockEmployee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: string | null;
  status: 'active' | 'offboarding' | 'offboarded';
  organizationId: string;
  offboardedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  externalId: string | null;
}

export interface MockIntegration {
  id: string;
  type: string;
  name: string;
  isConnected: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
  lastTestedAt: Date | null;
  lastTestStatus: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockRevocation {
  id: string;
  integration: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  revokedAt: Date | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockEvent {
  id: string;
  triggeredAt: Date;
  completedAt: Date | null;
  status: 'in_progress' | 'completed' | 'partial' | 'failed';
  triggeredBy: string;
  n8nExecutionId: string | null;
  employeeId: string;
  organizationId: string;
}

// ── Seed Data ──────────────────────────────────────────────────────────────

const ORG_ID = 'demo-org-id';

const org: MockOrg = {
  id: ORG_ID,
  name: 'Acme Corp',
  domain: 'acme.com',
  hrisType: 'manual',
  webhookSecret: 'secureonboard-dev-secret-change-in-prod',
};

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}

function secsAgo(n: number) {
  return new Date(Date.now() - n * 1000);
}

const employees: MockEmployee[] = [
  { id: 'emp-1', name: 'Alice Martin', email: 'alice@acme.com', department: 'Engineering', role: 'Senior Engineer', status: 'active', organizationId: ORG_ID, offboardedAt: null, createdAt: daysAgo(90), updatedAt: daysAgo(1), externalId: null },
  { id: 'emp-2', name: 'Bob Kim', email: 'bob@acme.com', department: 'Product', role: 'Product Manager', status: 'active', organizationId: ORG_ID, offboardedAt: null, createdAt: daysAgo(80), updatedAt: daysAgo(2), externalId: null },
  { id: 'emp-3', name: 'Carol White', email: 'carol@acme.com', department: 'Design', role: 'UX Designer', status: 'active', organizationId: ORG_ID, offboardedAt: null, createdAt: daysAgo(70), updatedAt: daysAgo(3), externalId: null },
  { id: 'emp-4', name: 'Dan Torres', email: 'dan@acme.com', department: 'Sales', role: 'Account Executive', status: 'active', organizationId: ORG_ID, offboardedAt: null, createdAt: daysAgo(60), updatedAt: daysAgo(4), externalId: null },
  { id: 'emp-5', name: 'Eva Chen', email: 'eva@acme.com', department: 'Engineering', role: 'Frontend Engineer', status: 'active', organizationId: ORG_ID, offboardedAt: null, createdAt: daysAgo(50), updatedAt: daysAgo(5), externalId: null },
  { id: 'emp-6', name: 'Frank Liu', email: 'frank@acme.com', department: 'Marketing', role: 'Marketing Lead', status: 'active', organizationId: ORG_ID, offboardedAt: null, createdAt: daysAgo(40), updatedAt: daysAgo(6), externalId: null },
  { id: 'emp-7', name: 'Sarah Johnson', email: 'sarah@acme.com', department: 'Engineering', role: 'Staff Engineer', status: 'offboarded', organizationId: ORG_ID, offboardedAt: daysAgo(2), createdAt: daysAgo(365), updatedAt: daysAgo(2), externalId: null },
  { id: 'emp-8', name: 'Mike Chen', email: 'mike@acme.com', department: 'Sales', role: 'SDR', status: 'offboarded', organizationId: ORG_ID, offboardedAt: daysAgo(3), createdAt: daysAgo(200), updatedAt: daysAgo(3), externalId: null },
  { id: 'emp-9', name: 'Priya Sharma', email: 'priya@acme.com', department: 'Design', role: 'UI Designer', status: 'offboarded', organizationId: ORG_ID, offboardedAt: daysAgo(5), createdAt: daysAgo(300), updatedAt: daysAgo(5), externalId: null },
];

const integrations: MockIntegration[] = [
  { id: 'int-1', type: 'google', name: 'Google Workspace', isConnected: true, accessToken: 'demo-token-google', refreshToken: null, expiresAt: null, metadata: null, lastTestedAt: secsAgo(60), lastTestStatus: 'success', organizationId: ORG_ID, createdAt: daysAgo(30), updatedAt: secsAgo(60) },
  { id: 'int-2', type: 'slack', name: 'Slack', isConnected: true, accessToken: 'demo-token-slack', refreshToken: null, expiresAt: null, metadata: null, lastTestedAt: secsAgo(60), lastTestStatus: 'success', organizationId: ORG_ID, createdAt: daysAgo(30), updatedAt: secsAgo(60) },
  { id: 'int-3', type: 'github', name: 'GitHub', isConnected: true, accessToken: 'demo-token-github', refreshToken: null, expiresAt: null, metadata: null, lastTestedAt: secsAgo(60), lastTestStatus: 'success', organizationId: ORG_ID, createdAt: daysAgo(30), updatedAt: secsAgo(60) },
];

const events: MockEvent[] = [
  { id: 'evt-1', triggeredAt: secsAgo(120), completedAt: secsAgo(82), status: 'completed', triggeredBy: 'manual', n8nExecutionId: null, employeeId: 'emp-7', organizationId: ORG_ID },
  { id: 'evt-2', triggeredAt: secsAgo(3600), completedAt: secsAgo(3546), status: 'partial', triggeredBy: 'manual', n8nExecutionId: null, employeeId: 'emp-8', organizationId: ORG_ID },
  { id: 'evt-3', triggeredAt: secsAgo(86400), completedAt: secsAgo(86359), status: 'completed', triggeredBy: 'webhook', n8nExecutionId: null, employeeId: 'emp-9', organizationId: ORG_ID },
];

const revocations: MockRevocation[] = [
  // evt-1 (Sarah - all success)
  { id: 'rev-1', integration: 'google', status: 'success', revokedAt: secsAgo(90), errorMessage: null, metadata: null, eventId: 'evt-1', createdAt: secsAgo(120), updatedAt: secsAgo(90) },
  { id: 'rev-2', integration: 'slack', status: 'success', revokedAt: secsAgo(88), errorMessage: null, metadata: null, eventId: 'evt-1', createdAt: secsAgo(120), updatedAt: secsAgo(88) },
  { id: 'rev-3', integration: 'github', status: 'success', revokedAt: secsAgo(82), errorMessage: null, metadata: null, eventId: 'evt-1', createdAt: secsAgo(120), updatedAt: secsAgo(82) },
  // evt-2 (Mike - github failed)
  { id: 'rev-4', integration: 'google', status: 'success', revokedAt: secsAgo(3555), errorMessage: null, metadata: null, eventId: 'evt-2', createdAt: secsAgo(3600), updatedAt: secsAgo(3555) },
  { id: 'rev-5', integration: 'slack', status: 'success', revokedAt: secsAgo(3552), errorMessage: null, metadata: null, eventId: 'evt-2', createdAt: secsAgo(3600), updatedAt: secsAgo(3552) },
  { id: 'rev-6', integration: 'github', status: 'failed', revokedAt: null, errorMessage: 'API rate limit exceeded', metadata: null, eventId: 'evt-2', createdAt: secsAgo(3600), updatedAt: secsAgo(3546) },
  // evt-3 (Priya - all success)
  { id: 'rev-7', integration: 'google', status: 'success', revokedAt: secsAgo(86365), errorMessage: null, metadata: null, eventId: 'evt-3', createdAt: secsAgo(86400), updatedAt: secsAgo(86365) },
  { id: 'rev-8', integration: 'slack', status: 'success', revokedAt: secsAgo(86363), errorMessage: null, metadata: null, eventId: 'evt-3', createdAt: secsAgo(86400), updatedAt: secsAgo(86363) },
  { id: 'rev-9', integration: 'github', status: 'success', revokedAt: secsAgo(86359), errorMessage: null, metadata: null, eventId: 'evt-3', createdAt: secsAgo(86400), updatedAt: secsAgo(86359) },
];

// ── Store (mutable) ─────────────────────────────────────────────────────────

export const store = {
  org,
  employees: [...employees],
  integrations: [...integrations],
  events: [...events],
  revocations: [...revocations],

  // ── Helpers ────────────────────────────────────────────────────────────

  getOrg(id: string) {
    return store.org.id === id ? store.org : null;
  },

  getEmployees(orgId: string) {
    return store.employees
      .filter((e) => e.organizationId === orgId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((e) => ({
        ...e,
        events: store.events
          .filter((ev) => ev.employeeId === e.id)
          .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
          .slice(0, 1)
          .map((ev) => ({
            ...ev,
            revocations: store.revocations.filter((r) => r.eventId === ev.id),
            employee: { name: e.name, email: e.email, department: e.department },
          })),
      }));
  },

  getEmployee(id: string) {
    const e = store.employees.find((emp) => emp.id === id);
    if (!e) return null;
    return {
      ...e,
      events: store.events
        .filter((ev) => ev.employeeId === id)
        .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
        .map((ev) => ({
          ...ev,
          revocations: store.revocations.filter((r) => r.eventId === ev.id),
          employee: { name: e.name, email: e.email, department: e.department },
        })),
    };
  },

  addEmployee(data: { name: string; email: string; department?: string; role?: string; organizationId: string }) {
    const emp: MockEmployee = {
      id: `emp-${randomUUID()}`,
      name: data.name,
      email: data.email,
      department: data.department || null,
      role: data.role || null,
      status: 'active',
      organizationId: data.organizationId,
      offboardedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      externalId: null,
    };
    store.employees.push(emp);
    return emp;
  },

  updateEmployee(id: string, data: Partial<Pick<MockEmployee, 'name' | 'department' | 'role' | 'status' | 'offboardedAt'>>) {
    const idx = store.employees.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    store.employees[idx] = { ...store.employees[idx], ...data, updatedAt: new Date() };
    return store.employees[idx];
  },

  deleteEmployee(id: string) {
    const idx = store.employees.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    store.employees.splice(idx, 1);
    return true;
  },

  getIntegrations(orgId: string) {
    return store.integrations.filter((i) => i.organizationId === orgId);
  },

  upsertIntegration(data: { type: string; name: string; accessToken?: string; organizationId: string; isConnected?: boolean }) {
    const idx = store.integrations.findIndex(
      (i) => i.type === data.type && i.organizationId === data.organizationId
    );
    if (idx !== -1) {
      store.integrations[idx] = {
        ...store.integrations[idx],
        name: data.name || store.integrations[idx].name,
        accessToken: data.accessToken || store.integrations[idx].accessToken,
        isConnected: data.isConnected ?? true,
        updatedAt: new Date(),
      };
      return store.integrations[idx];
    }
    const int: MockIntegration = {
      id: `int-${randomUUID()}`,
      type: data.type,
      name: data.name || data.type,
      isConnected: true,
      accessToken: data.accessToken || null,
      refreshToken: null,
      expiresAt: null,
      metadata: null,
      lastTestedAt: null,
      lastTestStatus: null,
      organizationId: data.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.integrations.push(int);
    return int;
  },

  disconnectIntegration(id: string) {
    const idx = store.integrations.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    store.integrations[idx] = {
      ...store.integrations[idx],
      isConnected: false,
      accessToken: null,
      refreshToken: null,
      updatedAt: new Date(),
    };
    return true;
  },

  testIntegration(id: string) {
    const idx = store.integrations.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const passed = !!store.integrations[idx].accessToken;
    store.integrations[idx] = {
      ...store.integrations[idx],
      lastTestedAt: new Date(),
      lastTestStatus: passed ? 'success' : 'failed',
      updatedAt: new Date(),
    };
    return store.integrations[idx];
  },

  getEvents(orgId: string, opts?: { limit?: number; offset?: number; status?: string; employeeId?: string }) {
    let list = store.events
      .filter((e) => e.organizationId === orgId)
      .filter((e) => !opts?.status || e.status === opts.status)
      .filter((e) => !opts?.employeeId || e.employeeId === opts.employeeId)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

    const total = list.length;
    if (opts?.offset) list = list.slice(opts.offset);
    if (opts?.limit) list = list.slice(0, opts.limit);

    return {
      events: list.map((ev) => {
        const emp = store.employees.find((e) => e.id === ev.employeeId);
        return {
          ...ev,
          employee: { name: emp?.name || 'Unknown', email: emp?.email || '', department: emp?.department },
          revocations: store.revocations.filter((r) => r.eventId === ev.id),
        };
      }),
      total,
    };
  },

  createEvent(data: { employeeId: string; organizationId: string; triggeredBy: string; integrationTypes: string[] }) {
    const event: MockEvent = {
      id: `evt-${randomUUID()}`,
      triggeredAt: new Date(),
      completedAt: null,
      status: 'in_progress',
      triggeredBy: data.triggeredBy,
      n8nExecutionId: null,
      employeeId: data.employeeId,
      organizationId: data.organizationId,
    };
    store.events.push(event);

    const revs: MockRevocation[] = data.integrationTypes.map((type) => ({
      id: `rev-${randomUUID()}`,
      integration: type,
      status: 'pending',
      revokedAt: null,
      errorMessage: null,
      metadata: null,
      eventId: event.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    store.revocations.push(...revs);

    return { ...event, revocations: revs };
  },

  updateRevocation(eventId: string, integration: string, status: string, errorMessage?: string) {
    const idx = store.revocations.findIndex(
      (r) => r.eventId === eventId && r.integration === integration
    );
    if (idx === -1) return false;
    store.revocations[idx] = {
      ...store.revocations[idx],
      status: status as MockRevocation['status'],
      revokedAt: status === 'success' ? new Date() : null,
      errorMessage: errorMessage || null,
      updatedAt: new Date(),
    };

    // Check if all revocations are done → update event
    const allRevs = store.revocations.filter((r) => r.eventId === eventId);
    const allDone = allRevs.every((r) => r.status !== 'pending');
    if (allDone) {
      const anyFailed = allRevs.some((r) => r.status === 'failed');
      const allSuccess = allRevs.every((r) => r.status === 'success');
      const evtIdx = store.events.findIndex((e) => e.id === eventId);
      if (evtIdx !== -1) {
        store.events[evtIdx] = {
          ...store.events[evtIdx],
          status: allSuccess ? 'completed' : anyFailed ? 'partial' : 'completed',
          completedAt: new Date(),
        };
        // Update employee status
        const empIdx = store.employees.findIndex((e) => e.id === store.events[evtIdx].employeeId);
        if (empIdx !== -1) {
          store.employees[empIdx] = {
            ...store.employees[empIdx],
            status: 'offboarded',
            offboardedAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }
    }
    return true;
  },

  getStats(orgId: string) {
    const emps = store.employees.filter((e) => e.organizationId === orgId);
    const completed = store.events.filter(
      (e) => e.organizationId === orgId && e.status === 'completed' && e.completedAt
    );
    let avgRevocationSeconds = 0;
    if (completed.length > 0) {
      const totalMs = completed.reduce(
        (sum, e) => sum + (e.completedAt!.getTime() - e.triggeredAt.getTime()),
        0
      );
      avgRevocationSeconds = Math.round(totalMs / completed.length / 1000);
    }
    return {
      totalEmployees: emps.length,
      activeEmployees: emps.filter((e) => e.status === 'active').length,
      offboardedEmployees: emps.filter((e) => e.status === 'offboarded').length,
      totalOffboardingEvents: store.events.filter((e) => e.organizationId === orgId).length,
      avgRevocationSeconds,
    };
  },
};
