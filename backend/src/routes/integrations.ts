import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const integrationRouter = Router();

// GET /api/integrations?orgId=xxx
integrationRouter.get('/', async (req: Request, res: Response) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });

  const integrations = await prisma.integration.findMany({
    where: { organizationId: orgId as string },
  });

  // Mask tokens in response
  const safe = integrations.map(({ accessToken, refreshToken, ...rest }) => ({
    ...rest,
    hasCredentials: !!accessToken,
  }));

  return res.json(safe);
});

// POST /api/integrations — connect or update an integration
integrationRouter.post('/', async (req: Request, res: Response) => {
  const { type, name, accessToken, refreshToken, expiresAt, metadata, organizationId } = req.body;

  if (!type || !organizationId) {
    return res.status(400).json({ error: 'type and organizationId required' });
  }

  const integration = await prisma.integration.upsert({
    where: { type_organizationId: { type, organizationId } },
    update: {
      name,
      accessToken,
      refreshToken,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata,
      isConnected: true,
    },
    create: {
      type,
      name: name || type,
      accessToken,
      refreshToken,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata,
      isConnected: true,
      organizationId,
    },
  });

  return res.json({ ...integration, accessToken: undefined, refreshToken: undefined });
});

// DELETE /api/integrations/:id — disconnect
integrationRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.integration.update({
    where: { id: req.params.id },
    data: { isConnected: false, accessToken: null, refreshToken: null },
  });

  return res.json({ success: true });
});

// POST /api/integrations/:id/test — test connection
integrationRouter.post('/:id/test', async (req: Request, res: Response) => {
  const integration = await prisma.integration.findUnique({
    where: { id: req.params.id },
  });

  if (!integration) return res.status(404).json({ error: 'Integration not found' });

  // TODO: actually test the API connection based on integration.type
  // For now, simulate a test
  const testPassed = !!integration.accessToken;

  await prisma.integration.update({
    where: { id: req.params.id },
    data: {
      lastTestedAt: new Date(),
      lastTestStatus: testPassed ? 'success' : 'failed',
    },
  });

  return res.json({ success: testPassed, testedAt: new Date().toISOString() });
});
