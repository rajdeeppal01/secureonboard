import { Router, Request, Response } from 'express';
import { db as store } from '../lib/db';

export const integrationRouter = Router();

// GET /api/integrations?orgId=xxx
integrationRouter.get('/', async (req: Request, res: Response) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });

  const integrations = store.getIntegrations(orgId as string);
  const safe = integrations.map(({ accessToken, refreshToken, ...rest }) => ({
    ...rest,
    hasCredentials: !!accessToken,
  }));
  return res.json(safe);
});

// POST /api/integrations — connect or update
integrationRouter.post('/', async (req: Request, res: Response) => {
  const { type, name, accessToken, organizationId } = req.body;
  if (!type || !organizationId) {
    return res.status(400).json({ error: 'type and organizationId required' });
  }
  const integration = store.upsertIntegration({ type, name, accessToken, organizationId });
  const { accessToken: _, refreshToken: __, ...safe } = integration;
  return res.json({ ...safe, hasCredentials: !!_ });
});

// DELETE /api/integrations/:id — disconnect
integrationRouter.delete('/:id', async (req: Request, res: Response) => {
  const ok = store.disconnectIntegration(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Integration not found' });
  return res.json({ success: true });
});

// POST /api/integrations/:id/test
integrationRouter.post('/:id/test', async (req: Request, res: Response) => {
  const result = store.testIntegration(req.params.id);
  if (!result) return res.status(404).json({ error: 'Integration not found' });
  return res.json({ success: result.lastTestStatus === 'success', testedAt: result.lastTestedAt?.toISOString() });
});
