import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { triggerOffboardingWorkflow } from '../services/n8n.service';
import crypto from 'crypto';

export const webhookRouter = Router();

/**
 * POST /api/webhooks/offboard
 * Receives offboarding event from HRIS systems (BambooHR, Rippling, etc.)
 * or can be triggered manually from the dashboard
 */
webhookRouter.post('/offboard', async (req: Request, res: Response) => {
  try {
    const { employeeEmail, organizationId, source = 'webhook' } = req.body;

    if (!employeeEmail || !organizationId) {
      return res.status(400).json({ error: 'employeeEmail and organizationId are required' });
    }

    // Find the employee
    const employee = await prisma.employee.findUnique({
      where: { email_organizationId: { email: employeeEmail, organizationId } },
    });

    if (!employee) {
      return res.status(404).json({ error: `Employee ${employeeEmail} not found in organization` });
    }

    if (employee.status === 'offboarded') {
      return res.status(409).json({ error: 'Employee is already offboarded' });
    }

    // Mark employee as offboarding
    await prisma.employee.update({
      where: { id: employee.id },
      data: { status: 'offboarding' },
    });

    // Get active integrations for this org
    const integrations = await prisma.integration.findMany({
      where: { organizationId, isConnected: true },
    });

    // Create the offboarding event
    const event = await prisma.offboardingEvent.create({
      data: {
        employeeId: employee.id,
        organizationId,
        status: 'in_progress',
        triggeredBy: source,
        revocations: {
          create: integrations.map((integration) => ({
            integration: integration.type,
            status: 'pending',
          })),
        },
      },
      include: { revocations: true },
    });

    // Trigger n8n workflow asynchronously
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
 * Receives status updates from n8n workflow executions
 */
webhookRouter.post('/n8n/status', async (req: Request, res: Response) => {
  try {
    const { eventId, integration, status, errorMessage, metadata } = req.body;

    // Update the specific revocation record
    await prisma.accessRevocation.updateMany({
      where: { eventId, integration },
      data: {
        status,
        revokedAt: status === 'success' ? new Date() : undefined,
        errorMessage: errorMessage || null,
        metadata: metadata || undefined,
      },
    });

    // Check if all revocations for this event are done
    const allRevocations = await prisma.accessRevocation.findMany({
      where: { eventId },
    });

    const allDone = allRevocations.every((r) => r.status !== 'pending');
    const anyFailed = allRevocations.some((r) => r.status === 'failed');
    const allSuccess = allRevocations.every((r) => r.status === 'success');

    if (allDone) {
      const eventStatus = allSuccess ? 'completed' : anyFailed ? 'partial' : 'completed';

      await prisma.offboardingEvent.update({
        where: { id: eventId },
        data: { status: eventStatus, completedAt: new Date() },
      });

      // Update employee status
      const event = await prisma.offboardingEvent.findUnique({
        where: { id: eventId },
        select: { employeeId: true },
      });

      if (event) {
        await prisma.employee.update({
          where: { id: event.employeeId },
          data: {
            status: 'offboarded',
            offboardedAt: new Date(),
          },
        });
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('n8n status webhook error:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * POST /api/webhooks/bamboohr
 * BambooHR webhook endpoint (employee termination)
 */
webhookRouter.post('/bamboohr', async (req: Request, res: Response) => {
  // BambooHR sends HMAC-SHA256 signature
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

  // TODO: Parse BambooHR payload format and call /offboard internally
  return res.json({ received: true });
});
