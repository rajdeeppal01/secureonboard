import { Router, Request, Response } from 'express';
import { db as store } from '../lib/db';

export const employeeRouter = Router();

// GET /api/employees?orgId=xxx
employeeRouter.get('/', async (req: Request, res: Response) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });
  return res.json(store.getEmployees(orgId as string));
});

// POST /api/employees
employeeRouter.post('/', async (req: Request, res: Response) => {
  const { name, email, department, role, organizationId } = req.body;
  if (!name || !email || !organizationId) {
    return res.status(400).json({ error: 'name, email, organizationId required' });
  }
  // Check for duplicate email
  const existing = store.getEmployees(organizationId).find((e) => e.email === email);
  if (existing) return res.status(409).json({ error: 'Employee with this email already exists' });

  const employee = store.addEmployee({ name, email, department, role, organizationId });
  return res.status(201).json(employee);
});

// GET /api/employees/:id
employeeRouter.get('/:id', async (req: Request, res: Response) => {
  const employee = store.getEmployee(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  return res.json(employee);
});

// PATCH /api/employees/:id
employeeRouter.patch('/:id', async (req: Request, res: Response) => {
  const { name, department, role, status } = req.body;
  const employee = store.updateEmployee(req.params.id, { name, department, role, status });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  return res.json(employee);
});

// DELETE /api/employees/:id
employeeRouter.delete('/:id', async (req: Request, res: Response) => {
  const ok = store.deleteEmployee(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Employee not found' });
  return res.json({ success: true });
});
