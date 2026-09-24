import { Router, Request, Response } from 'express';
import { db as store } from '../lib/db';
import { triggerOffboardingWorkflow } from '../services/n8n.service';
import crypto from 'crypto';

export const webhookRouter = Router();

// POST /api/webhooks/offboard
webhookRouter.post('/offboard', async (req: Request, res: Response) => {
  try {
    const { employeeEmail, organizationId, source = 'manual' } = req.body;
    if (!employeeEmail || !organizationId) {
      return res.status(400).json({ error: 'employeeEmail and organizationId are required' });
    }

    const employees = await store.getEmployees(organizationId as string);
    const employee = employees.find((e: any) => e.email === employeeEmail);

    if (!employee) {
      return res.status(404).json({ error: `Employee ${employeeEmail} not found` });
    }
    if (employee.status === 'offboarded') {
      return res.status(409).json({ error: 'Employee is already offboarded' });
    }

    await store.updateEmployee(employee.id, { status: 'offboarding' });

    const integrations = await store.getIntegrations(organizationId as string);
    const activeIntegrations = integrations.filter((i: any) => i.isConnected);

    const event = await store.createEvent({
      employeeId: employee.id,
      organizationId: organizationId as string,
      triggeredBy: source as string,
      integrationTypes: activeIntegrations.map((i: any) => i.type),
    });

    triggerOffboardingWorkflow({
      eventId: (event as any).id,
      employeeEmail,
      employeeName: employee.name,
      organizationId: organizationId as string,
      integrations: activeIntegrations.map((i: any) => i.type),
    }).catch(console.error);

    return res.status(202).json({
      message: 'Offboarding initiated',
      eventId: (event as any).id,
      employee: { name: employee.name, email: employeeEmail },
      integrationsQueued: activeIntegrations.length,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Failed to process offboarding webhook' });
  }
});

// POST /api/webhooks/n8n/status
webhookRouter.post('/n8n/status', async (req: Request, res: Response) => {
  try {
    const { eventId, integration, status, errorMessage } = req.body;
    await store.updateRevocation(eventId, integration, status, errorMessage);
    return res.json({ success: true });
  } catch (error) {
    console.error('n8n status webhook error:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/webhooks/bamboohr
webhookRouter.post('/bamboohr', async (req: Request, res: Response) => {
  const signature = req.headers['x-bamboohr-signature'] as string;
  const rawBody = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET || '';
  const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  return res.json({ received: true });
});
