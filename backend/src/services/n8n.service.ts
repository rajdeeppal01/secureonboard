import axios from 'axios';

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const WORKFLOW_ID = process.env.N8N_OFFBOARDING_WORKFLOW_ID || '';

interface OffboardingPayload {
  eventId: string;
  employeeEmail: string;
  employeeName: string;
  organizationId: string;
  integrations: string[];
}

/**
 * Triggers the master offboarding n8n workflow.
 * n8n will call back to /api/webhooks/n8n/status for each integration result.
 */
export async function triggerOffboardingWorkflow(payload: OffboardingPayload): Promise<void> {
  if (!WORKFLOW_ID) {
    console.warn('⚠️  N8N_OFFBOARDING_WORKFLOW_ID not set — skipping n8n trigger (dev mode)');
    return simulateOffboarding(payload);
  }

  try {
    await axios.post(
      `${N8N_BASE_URL}/api/v1/workflows/${WORKFLOW_ID}/execute`,
      { data: payload },
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ n8n workflow triggered for event ${payload.eventId}`);
  } catch (error: any) {
    console.error('❌ Failed to trigger n8n workflow:', error.message);
    throw error;
  }
}

/**
 * Dev-mode simulation: simulates n8n callbacks without a real n8n instance.
 * Marks all integrations as successful after a short delay.
 */
async function simulateOffboarding(payload: OffboardingPayload): Promise<void> {
  console.log(`🧪 [DEV] Simulating offboarding for ${payload.employeeEmail}`);

  const backendUrl = `http://localhost:${process.env.PORT || 4000}`;

  for (const integration of payload.integrations) {
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));

    try {
      await axios.post(`${backendUrl}/api/webhooks/n8n/status`, {
        eventId: payload.eventId,
        integration,
        status: 'success',
        metadata: { simulated: true, timestamp: new Date().toISOString() },
      });
      console.log(`  ✅ [DEV] Simulated ${integration} revocation for ${payload.employeeEmail}`);
    } catch (err) {
      console.error(`  ❌ [DEV] Failed to call back status for ${integration}`);
    }
  }
}
