import { Router, Request, Response } from 'express';
import { db as store } from '../lib/db';

export const organizationRouter = Router();

// GET /api/organizations/:id
organizationRouter.get('/:id', async (req: Request, res: Response) => {
  const org = store.getOrg(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  const { webhookSecret, ...safe } = org;
  return res.json(safe);
});
