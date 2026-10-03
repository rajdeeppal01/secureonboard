import { Octokit } from 'octokit';
import { db as store } from '../db';

export const revokeGithubAccess = async (orgId: string, userEmail: string) => {
  try {
    const integrations = await store.getIntegrations(orgId);
    const githubIntegration = integrations.find((i: any) => i.type === 'github');
    
    if (!githubIntegration || !githubIntegration.accessToken) {
      throw new Error('GitHub not connected or missing credentials.');
    }

    const octokit = new Octokit({ auth: githubIntegration.accessToken });

    // We need the GitHub organization name to remove the user from.
    // In a real app, this would be collected during the OAuth flow and stored in metadata.
    // For now, we'll try to get the org the authenticated user belongs to.
    const { data: orgs } = await octokit.rest.orgs.listForAuthenticatedUser();
    if (orgs.length === 0) {
        throw new Error('Authenticated GitHub user is not part of any organizations.');
    }
    const targetGithubOrg = orgs[0].login; // Defaulting to the first org

    // 1. Find the GitHub username by email
    // Note: This relies on the user having the email associated with their GitHub account (public or commit history)
    const { data: searchResults } = await octokit.rest.search.users({
      q: `${userEmail} in:email`,
    });

    if (searchResults.total_count === 0) {
      throw new Error(`No GitHub account found matching email ${userEmail}. They may use a personal email for GitHub.`);
    }

    const githubUsername = searchResults.items[0].login;

    // 2. Remove user from the organization
    await octokit.rest.orgs.removeMembershipForUser({
      org: targetGithubOrg,
      username: githubUsername,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error revoking GitHub access:', error);
    return { success: false, error: error.message };
  }
};
