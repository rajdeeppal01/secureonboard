import { Router, Request, Response } from 'express';
import { db as store } from '../lib/db';
import { triggerOffboardingWorkflow } from '../services/n8n.service';
import crypto from 'crypto';

export const webhookRouter = Router();

/**
 * POST /api/webhooks/offboard
 */
webhookRouter.post('/offboard', async (req: Request, res: Response) => {
  try {
    const { employeeEmail, organizationId, source = 'manual' } = req.body;

    if (!employeeEmail || !organizationId) {
      return res.status(400).json({ error: 'employeeEmail and organizationId are required' });
    }

    const employees = store.getEmployees(organizationId);
    const employee = employees.find((e) => e.email === employeeEmail);

    if (!employee) {
      return res.status(404).json({ error: `Employee ${employeeEmail} not found in organization` });
    }

    if (employee.status === 'offboarded') {
      return res.status(409).json({ error: 'Employee is already offboarded' });
    }

    // Mark as offboarding
    store.updateEmployee(employee.id, { status: 'offboarding' });

    // Get active integrations
    const integrations = store.getIntegrations(organizationId).filter((i) => i.isConnected);

    // Create event
    const event = store.createEvent({
      employeeId: employee.id,
      organizationId,
      triggeredBy: source,
      integrationTypes: integrations.map((i) => i.type),
    });

    // Trigger n8n (or simulation)
    triggerOffboardingWorkflow({
      eventId: event.id,
      employeeEmail,
      employeeName: employee.name,
      organizationId,
      integrations: integrations.map((i) => i.type),
    }).catch(console.error);

    return res.status(202).json({
      message: 'Offboarding initiated',
      eventId: event.id,
      employee: { name: employee.name, email: employeeEmail },
      integrationsQueued: integrations.length,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Failed to process offboarding webhook' });
  }
});

/**
 * POST /api/webhooks/n8n/status
 */
webhookRouter.post('/n8n/status', async (req: Request, res: Response) => {
  try {
    const { eventId, integration, status, errorMessage } = req.body;
    store.updateRevocation(eventId, integration, status, errorMessage);
    return res.json({ success: true });
  } catch (error) {
    console.error('n8n status webhook error:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * POST /api/webhooks/bamboohr
 */
webhookRouter.post('/bamboohr', async (req: Request, res: Response) => {
  const signature = req.headers['x-bamboohr-signature'] as string;
  const rawBody = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET || '';

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // TODO: Parse BambooHR payload and call /offboard
  return res.json({ received: true });
});
