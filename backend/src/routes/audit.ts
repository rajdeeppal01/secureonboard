import { Router, Request, Response } from 'express';
import { db as store } from '../lib/db';

export const auditRouter = Router();

// GET /api/audit?orgId=xxx&limit=50&offset=0&status=xxx
auditRouter.get('/', async (req: Request, res: Response) => {
  const { orgId, limit = '50', offset = '0', employeeId, status } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });

  const result = await store.getEvents(orgId as string, {
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
    ...(status ? { status: status as string } : {}),
    ...(employeeId ? { employeeId: employeeId as string } : {}),
  });

  return res.json({
    events: result.events,
    total: result.total,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });
});

// GET /api/audit/stats?orgId=xxx
auditRouter.get('/stats', async (req: Request, res: Response) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });
  const stats = await store.getStats(orgId as string);
  return res.json(stats);
});

// GET /api/audit/export?orgId=xxx&format=csv
auditRouter.get('/export', async (req: Request, res: Response) => {
  const { orgId, format = 'csv' } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });

  const { events } = await store.getEvents(orgId as string);

  if (format === 'csv') {
    const rows = [
      'Event ID,Employee Name,Employee Email,Department,Triggered At,Completed At,Status,Duration (s),Google,Slack,GitHub',
      ...events.map((e: any) => {
        const getRevStatus = (type: string) =>
          e.revocations.find((r: any) => r.integration === type)?.status || 'N/A';
        const durationSecs = e.completedAt
          ? Math.round((new Date(e.completedAt).getTime() - new Date(e.triggeredAt).getTime()) / 1000)
          : '';
        return [
          e.id,
          e.employee.name,
          e.employee.email,
          e.employee.department || '',
          new Date(e.triggeredAt).toISOString(),
          e.completedAt ? new Date(e.completedAt).toISOString() : '',
          e.status,
          durationSecs,
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

// POST /api/audit/seed (demo only)
import { exec } from 'child_process';
auditRouter.post('/seed', (req, res) => {
  exec('npm run db:seed', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true, output: stdout });
  });
});
