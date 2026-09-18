import { prisma } from './prisma';
import { randomUUID } from 'crypto';

/**
 * Prisma-backed store with the same interface as mockStore.ts
 * Used automatically when DATABASE_URL is set.
 */

export const prismaStore = {

  getOrg(id: string) {
    return prisma.organization.findUnique({ where: { id } });
  },

  getEmployees(orgId: string) {
    return prisma.employee.findMany({
      where: { organizationId: orgId },
      include: {
        events: {
          orderBy: { triggeredAt: 'desc' },
          take: 1,
          include: {
            revocations: true,
            employee: { select: { name: true, email: true, department: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  getEmployee(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { triggeredAt: 'desc' },
          include: {
            revocations: true,
            employee: { select: { name: true, email: true, department: true } },
          },
        },
      },
    });
  },

  addEmployee(data: { name: string; email: string; department?: string; role?: string; organizationId: string }) {
    return prisma.employee.create({ data });
  },

  async updateEmployee(id: string, data: { name?: string; department?: string; role?: string; status?: string; offboardedAt?: Date | null }) {
    return prisma.employee.update({ where: { id }, data });
  },

  async deleteEmployee(id: string): Promise<boolean> {
    await prisma.employee.delete({ where: { id } });
    return true;
  },

  getIntegrations(orgId: string) {
    return prisma.integration.findMany({ where: { organizationId: orgId } });
  },

  async upsertIntegration(data: { type: string; name: string; accessToken?: string; organizationId: string; isConnected?: boolean }) {
    return prisma.integration.upsert({
      where: { type_organizationId: { type: data.type, organizationId: data.organizationId } },
      update: {
        name: data.name || data.type,
        accessToken: data.accessToken,
        isConnected: data.isConnected ?? true,
      },
      create: {
        type: data.type,
        name: data.name || data.type,
        accessToken: data.accessToken,
        isConnected: true,
        organizationId: data.organizationId,
      },
    });
  },

  async disconnectIntegration(id: string): Promise<boolean> {
    await prisma.integration.update({
      where: { id },
      data: { isConnected: false, accessToken: null, refreshToken: null },
    });
    return true;
  },

  async testIntegration(id: string) {
    const integration = await prisma.integration.findUnique({ where: { id } });
    if (!integration) return null;
    const passed = !!integration.accessToken;
    return prisma.integration.update({
      where: { id },
      data: { lastTestedAt: new Date(), lastTestStatus: passed ? 'success' : 'failed' },
    });
  },

  async getEvents(orgId: string, opts?: { limit?: number; offset?: number; status?: string; employeeId?: string }) {
    const where = {
      organizationId: orgId,
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.employeeId ? { employeeId: opts.employeeId } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.offboardingEvent.findMany({
        where,
        include: {
          employee: { select: { name: true, email: true, department: true } },
          revocations: true,
        },
        orderBy: { triggeredAt: 'desc' },
        take: opts?.limit ?? 50,
        skip: opts?.offset ?? 0,
      }),
      prisma.offboardingEvent.count({ where }),
    ]);

    return { events, total };
  },

  async createEvent(data: { employeeId: string; organizationId: string; triggeredBy: string; integrationTypes: string[] }) {
    const event = await prisma.offboardingEvent.create({
      data: {
        employeeId: data.employeeId,
        organizationId: data.organizationId,
        status: 'in_progress',
        triggeredBy: data.triggeredBy,
        revocations: {
          create: data.integrationTypes.map((type) => ({ integration: type, status: 'pending' })),
        },
      },
      include: { revocations: true },
    });
    return event;
  },

  async updateRevocation(eventId: string, integration: string, status: string, errorMessage?: string): Promise<boolean> {
    await prisma.accessRevocation.updateMany({
      where: { eventId, integration },
      data: {
        status,
        revokedAt: status === 'success' ? new Date() : undefined,
        errorMessage: errorMessage || null,
      },
    });

    // Check if all revocations done → update event + employee
    const allRevs = await prisma.accessRevocation.findMany({ where: { eventId } });
    const allDone = allRevs.every((r) => r.status !== 'pending');
    if (allDone) {
      const anyFailed = allRevs.some((r) => r.status === 'failed');
      const eventStatus = anyFailed ? 'partial' : 'completed';
      const event = await prisma.offboardingEvent.update({
        where: { id: eventId },
        data: { status: eventStatus, completedAt: new Date() },
        select: { employeeId: true },
      });
      await prisma.employee.update({
        where: { id: event.employeeId },
        data: { status: 'offboarded', offboardedAt: new Date() },
      });
    }
    return true;
  },

  async getStats(orgId: string) {
    const [totalEmployees, activeEmployees, offboardedEmployees, totalOffboardingEvents, completedEvents] =
      await Promise.all([
        prisma.employee.count({ where: { organizationId: orgId } }),
        prisma.employee.count({ where: { organizationId: orgId, status: 'active' } }),
        prisma.employee.count({ where: { organizationId: orgId, status: 'offboarded' } }),
        prisma.offboardingEvent.count({ where: { organizationId: orgId } }),
        prisma.offboardingEvent.findMany({
          where: { organizationId: orgId, status: 'completed', completedAt: { not: null } },
          select: { triggeredAt: true, completedAt: true },
        }),
      ]);

    let avgRevocationSeconds = 0;
    if (completedEvents.length > 0) {
      const totalMs = completedEvents.reduce(
        (sum, e) => sum + (e.completedAt!.getTime() - e.triggeredAt.getTime()),
        0
      );
      avgRevocationSeconds = Math.round(totalMs / completedEvents.length / 1000);
    }

    return { totalEmployees, activeEmployees, offboardedEmployees, totalOffboardingEvents, avgRevocationSeconds };
  },
};
