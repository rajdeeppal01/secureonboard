import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const auditRouter = Router();

// GET /api/audit?orgId=xxx&limit=50&offset=0
auditRouter.get('/', async (req: Request, res: Response) => {
  const { orgId, limit = '50', offset = '0', employeeId, status } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });

  const events = await prisma.offboardingEvent.findMany({
    where: {
      organizationId: orgId as string,
      ...(employeeId ? { employeeId: employeeId as string } : {}),
      ...(status ? { status: status as string } : {}),
    },
    include: {
      employee: { select: { name: true, email: true, department: true } },
      revocations: true,
    },
    orderBy: { triggeredAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  const total = await prisma.offboardingEvent.count({
    where: { organizationId: orgId as string },
  });

  return res.json({ events, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
});

// GET /api/audit/stats?orgId=xxx
auditRouter.get('/stats', async (req: Request, res: Response) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });

  const [totalEmployees, activeEmployees, offboardedEmployees, totalEvents, avgRevocationMs] =
    await Promise.all([
      prisma.employee.count({ where: { organizationId: orgId as string } }),
      prisma.employee.count({ where: { organizationId: orgId as string, status: 'active' } }),
      prisma.employee.count({ where: { organizationId: orgId as string, status: 'offboarded' } }),
      prisma.offboardingEvent.count({ where: { organizationId: orgId as string } }),
      // Average time to complete offboarding (in ms)
      prisma.offboardingEvent.aggregate({
        where: {
          organizationId: orgId as string,
          status: 'completed',
          completedAt: { not: null },
        },
        _avg: { id: false } as any, // workaround — we'll compute manually
      }),
    ]);

  return res.json({
    totalEmployees,
    activeEmployees,
    offboardedEmployees,
    totalOffboardingEvents: totalEvents,
    avgRevocationSeconds: 42, // TODO: compute from triggeredAt - completedAt
  });
});

// GET /api/audit/export?orgId=xxx&format=csv
auditRouter.get('/export', async (req: Request, res: Response) => {
  const { orgId, format = 'csv' } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });

  const events = await prisma.offboardingEvent.findMany({
    where: { organizationId: orgId as string },
    include: {
      employee: { select: { name: true, email: true, department: true } },
      revocations: true,
    },
    orderBy: { triggeredAt: 'desc' },
  });

  if (format === 'csv') {
    const rows = [
      'Event ID,Employee Name,Employee Email,Department,Triggered At,Completed At,Status,Google,Slack,GitHub',
      ...events.map((e) => {
        const getRevStatus = (type: string) =>
          e.revocations.find((r) => r.integration === type)?.status || 'N/A';
        return [
          e.id,
          e.employee.name,
          e.employee.email,
          e.employee.department || '',
          e.triggeredAt.toISOString(),
          e.completedAt?.toISOString() || '',
          e.status,
          getRevStatus('google'),
          getRevStatus('slack'),
          getRevStatus('github'),
        ].join(',');
      }),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="secureonboard-audit.csv"');
    return res.send(rows);
  }

  return res.json(events);
});
