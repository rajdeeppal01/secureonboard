import { Router, Request, Response } from 'express';
import { db as store } from '../lib/db';

export const employeeRouter = Router();

// GET /api/employees?orgId=xxx
employeeRouter.get('/', async (req: Request, res: Response) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: 'orgId required' });
  const employees = await store.getEmployees(orgId as string);
  return res.json(employees);
});

// POST /api/employees
employeeRouter.post('/', async (req: Request, res: Response) => {
  const { name, email, department, role, organizationId } = req.body;
  if (!name || !email || !organizationId) {
    return res.status(400).json({ error: 'name, email, organizationId required' });
  }
  const existing = await store.getEmployees(organizationId as string);
  if (existing.find((e: any) => e.email === email)) {
    return res.status(409).json({ error: 'Employee with this email already exists' });
  }
  const employee = await store.addEmployee({ name, email, department, role, organizationId });
  return res.status(201).json(employee);
});

// GET /api/employees/:id
employeeRouter.get('/:id', async (req: Request, res: Response) => {
  const employee = await store.getEmployee(req.params.id as string);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  return res.json(employee);
});

// PATCH /api/employees/:id
employeeRouter.patch('/:id', async (req: Request, res: Response) => {
  const { name, department, role, status } = req.body;
  const employee = await store.updateEmployee(req.params.id as string, { name, department, role, status });
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  return res.json(employee);
});

// DELETE /api/employees/:id
employeeRouter.delete('/:id', async (req: Request, res: Response) => {
  const ok = await store.deleteEmployee(req.params.id as string);
  if (!ok) return res.status(404).json({ error: 'Employee not found' });
  return res.json({ success: true });
});
