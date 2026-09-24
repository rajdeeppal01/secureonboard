import { Router, Request, Response } from 'express';
import { db as store } from '../lib/db';

export const integrationRouter = Router();

// GET /api/integrations?orgId=xxx
integrationRouter.get('/', async (req: Request, res: Response) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });
  const integrations = await store.getIntegrations(orgId as string);
  const safe = integrations.map(({ accessToken, refreshToken, ...rest }: any) => ({
    ...rest,
    hasCredentials: !!accessToken,
  }));
  return res.json(safe);
});

// POST /api/integrations
integrationRouter.post('/', async (req: Request, res: Response) => {
  const { type, name, accessToken, organizationId } = req.body;
  if (!type || !organizationId) {
    return res.status(400).json({ error: 'type and organizationId required' });
  }
  const integration = await store.upsertIntegration({ type, name, accessToken, organizationId });
  const { accessToken: _a, refreshToken: _r, ...safe } = integration as any;
  return res.json({ ...safe, hasCredentials: !!_a });
});

// DELETE /api/integrations/:id
integrationRouter.delete('/:id', async (req: Request, res: Response) => {
  const ok = await store.disconnectIntegration(req.params.id as string);
  if (!ok) return res.status(404).json({ error: 'Integration not found' });
  return res.json({ success: true });
});

// POST /api/integrations/:id/test
integrationRouter.post('/:id/test', async (req: Request, res: Response) => {
  const result = await store.testIntegration(req.params.id as string);
  if (!result) return res.status(404).json({ error: 'Integration not found' });
  return res.json({
    success: (result as any).lastTestStatus === 'success',
    testedAt: (result as any).lastTestedAt?.toISOString(),
  });
});
