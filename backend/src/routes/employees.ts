import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const employeeRouter = Router();

// GET /api/employees?orgId=xxx
employeeRouter.get('/', async (req: Request, res: Response) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });

  const employees = await prisma.employee.findMany({
    where: { organizationId: orgId as string },
    include: {
      events: {
        orderBy: { triggeredAt: 'desc' },
        take: 1,
        include: { revocations: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(employees);
});

// POST /api/employees
employeeRouter.post('/', async (req: Request, res: Response) => {
  const { name, email, department, role, organizationId } = req.body;

  if (!name || !email || !organizationId) {
    return res.status(400).json({ error: 'name, email, organizationId required' });
  }

  const employee = await prisma.employee.create({
    data: { name, email, department, role, organizationId },
  });

  return res.status(201).json(employee);
});

// GET /api/employees/:id
employeeRouter.get('/:id', async (req: Request, res: Response) => {
  const employee = await prisma.employee.findUnique({
    where: { id: req.params.id },
    include: {
      events: {
        orderBy: { triggeredAt: 'desc' },
        include: { revocations: true },
      },
    },
  });

  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  return res.json(employee);
});

// PATCH /api/employees/:id
employeeRouter.patch('/:id', async (req: Request, res: Response) => {
  const { name, department, role, status } = req.body;

  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data: { name, department, role, status },
  });

  return res.json(employee);
});

// DELETE /api/employees/:id
employeeRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.employee.delete({ where: { id: req.params.id } });
  return res.json({ success: true });
});
