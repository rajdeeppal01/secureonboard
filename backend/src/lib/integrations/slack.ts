import { WebClient } from '@slack/web-api';
import { db as store } from '../db';

export const revokeSlackAccess = async (orgId: string, userEmail: string) => {
  try {
    const integrations = await store.getIntegrations(orgId);
    const slackIntegration = integrations.find((i: any) => i.type === 'slack');
    
    if (!slackIntegration || !slackIntegration.accessToken) {
      throw new Error('Slack not connected or missing credentials.');
    }

    const slack = new WebClient(slackIntegration.accessToken);

    // 1. Look up the user by email
    const lookupResponse = await slack.users.lookupByEmail({ email: userEmail });
    
    if (!lookupResponse.ok || !lookupResponse.user || !lookupResponse.user.id) {
      throw new Error(`User with email ${userEmail} not found in Slack.`);
    }

    const userId = lookupResponse.user.id;

    // 2. Deactivate the user.
    // Note: Official SCIM API requires Slack Plus/Enterprise Grid.
    // Many integrations use the undocumented users.admin.setInactive endpoint for standard plans.
    try {
      const response = await slack.apiCall('users.admin.setInactive', {
        user: userId,
      });
      if (!response.ok) {
        throw new Error((response as any).error || 'Failed to deactivate user.');
      }
    } catch (err: any) {
      if (err.message.includes('not_allowed') || err.message.includes('missing_scope')) {
         console.warn(`Slack token lacks admin privileges to deactivate users. This requires a workspace admin token.`);
         // We'll consider it a failed revocation so the user knows they need admin permissions.
         throw new Error('Slack token lacks admin privileges to deactivate users.');
      } else if (err.message.includes('unknown_method')) {
         console.warn('Slack users.admin.setInactive method not available for this workspace type.');
         throw new Error('Slack API method not available (requires SCIM or admin privileges).');
      }
      throw err;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error revoking Slack access:', error);
    return { success: false, error: error.message };
  }
};
