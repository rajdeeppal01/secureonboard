import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const organizationRouter = Router();

// POST /api/organizations — create org (called on first signup)
organizationRouter.post('/', async (req: Request, res: Response) => {
  const { name, domain, hrisType } = req.body;
  if (!name || !domain) return res.status(400).json({ error: 'name and domain required' });

  const org = await prisma.organization.create({
    data: { name, domain, hrisType: hrisType || 'manual' },
  });

  return res.status(201).json(org);
});

// GET /api/organizations/:id
organizationRouter.get('/:id', async (req: Request, res: Response) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { employees: true, integrations: true, events: true } },
    },
  });

  if (!org) return res.status(404).json({ error: 'Organization not found' });
  return res.json(org);
});
