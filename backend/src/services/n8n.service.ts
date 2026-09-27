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

import { revokeGoogleAccess } from '../lib/integrations/google';

/**
 * Processes the offboarding locally in the backend instead of n8n.
 * Runs actual SaaS API calls where implemented.
 */
async function simulateOffboarding(payload: OffboardingPayload): Promise<void> {
  console.log(`🚀 Processing offboarding for ${payload.employeeEmail}`);

  const backendUrl = `http://localhost:${process.env.PORT || 4000}`;
  
  // Note: in production, we should call store.updateRevocation directly instead of hitting our own webhook,
  // but keeping it this way to match the existing n8n structure.
  
  for (const integration of payload.integrations) {
    let resultStatus = 'success';
    let errorMessage = '';

    try {
      if (integration === 'google') {
        console.log(`  ⏳ Invoking actual Google Admin SDK for ${payload.employeeEmail}...`);
        const result = await revokeGoogleAccess(payload.organizationId, payload.employeeEmail);
        if (!result.success) {
          resultStatus = 'failed';
          errorMessage = result.error || 'Unknown Google API error';
          console.error(`  ❌ Google revocation failed: ${errorMessage}`);
        } else {
          console.log(`  ✅ Google revocation succeeded for ${payload.employeeEmail}`);
        }
      } else {
        // Simulate processing delay for other integrations
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
        console.log(`  ✅ [DEV] Simulated ${integration} revocation for ${payload.employeeEmail}`);
      }
    } catch (error: any) {
      resultStatus = 'failed';
      errorMessage = error.message;
    }

    try {
      await axios.post(`${backendUrl}/api/webhooks/n8n/status`, {
        eventId: payload.eventId,
        integration,
        status: resultStatus,
        errorMessage: errorMessage,
        metadata: { timestamp: new Date().toISOString() },
      });
    } catch (err) {
      console.error(`  ❌ Failed to call back status for ${integration}`);
    }
  }
}
