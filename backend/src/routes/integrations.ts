import { Router, Request, Response } from 'express';
import { db as store } from '../lib/db';

export const integrationRouter = Router();

// GET /api/integrations
integrationRouter.get('/', async (req: Request, res: Response) => {
  const orgId = (req as any).orgId;
  const integrations = await store.getIntegrations(orgId);
  const safe = integrations.map(({ accessToken, refreshToken, ...rest }: any) => ({
    ...rest,
    hasCredentials: !!accessToken,
  }));
  return res.json(safe);
});

// POST /api/integrations
integrationRouter.post('/', async (req: Request, res: Response) => {
  const orgId = (req as any).orgId;
  const { type, name, accessToken } = req.body;
  if (!type) {
    return res.status(400).json({ error: 'type is required' });
  }
  const integration = await store.upsertIntegration({ type, name, accessToken, organizationId: orgId });
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

import { getGoogleAuthUrl, getGoogleOAuthClient } from '../lib/integrations/google';

// GET /api/integrations/google/auth
integrationRouter.get('/google/auth', (req: Request, res: Response) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).send('orgId is required');
  const url = getGoogleAuthUrl(orgId as string);
  res.redirect(url);
});

// GET /api/integrations/google/callback
integrationRouter.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state: orgId } = req.query;
  if (!code || !orgId) return res.status(400).send('Missing code or state (orgId)');
  
  try {
    const oauth2Client = getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code as string);
    
    await store.upsertIntegration({
      type: 'google',
      name: 'Google Workspace',
      organizationId: orgId as string,
      accessToken: tokens.access_token!,
      // Optionally store tokens.refresh_token if you added it to schema
    });

    res.send(`
      <script>
        window.opener.postMessage({ type: 'integration_success', provider: 'google' }, '*');
        window.close();
      </script>
      <p>Authentication successful! You can close this tab.</p>
    `);
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed');
  }
});
