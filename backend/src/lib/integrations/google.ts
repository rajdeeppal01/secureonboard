import { google } from 'googleapis';
import { db as store } from '../db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/integrations/google/callback';

export const getGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

export const getGoogleAuthUrl = (state: string) => {
  const oauth2Client = getGoogleOAuthClient();
  const scopes = [
    'https://www.googleapis.com/auth/admin.directory.user'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state: state // usually contains orgId
  });
};

export const revokeGoogleAccess = async (orgId: string, userEmail: string) => {
  try {
    const integrations = await store.getIntegrations(orgId);
    const googleIntegration = integrations.find((i: any) => i.type === 'google');
    
    if (!googleIntegration || !googleIntegration.accessToken) {
      throw new Error('Google Workspace not connected or missing credentials.');
    }

    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: googleIntegration.accessToken,
      refresh_token: googleIntegration.refreshToken,
    });

    // Optionally handle token refresh and update DB if new token is given
    oauth2Client.on('tokens', async (tokens) => {
      // In a real app, we'd update the DB with the new tokens
      console.log('Got new tokens:', tokens);
    });

    const admin = google.admin({ version: 'directory_v1', auth: oauth2Client });

    // Suspend the user
    await admin.users.update({
      userKey: userEmail,
      requestBody: {
        suspended: true,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error revoking Google access:', error);
    return { success: false, error: error.message };
  }
};
