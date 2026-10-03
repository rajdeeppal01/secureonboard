import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';
import { db as store } from '../lib/db';

/**
 * Clerk authentication middleware for Express.
 * Must be mounted BEFORE all protected routes.
 */
export const clerkAuth = clerkMiddleware();

/**
 * Middleware that:
 * 1. Verifies the Clerk JWT from the Authorization header
 * 2. Looks up (or auto-creates) the Organization for this user
 * 3. Attaches orgId to req so route handlers don't need to receive it from the client
 */
export async function requireOrgContext(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Look up existing org for this Clerk user
    let org = await store.getOrgByClerkUserId(userId);

    if (!org) {
      // Auto-provision an org on first login
      // Derive a name from the token or use a default
      org = await store.createOrgForUser(userId);
    }

    // Attach to request for route handlers
    (req as any).orgId = (org as any).id;
    (req as any).clerkUserId = userId;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Expose requireAuth from Clerk for route-level protection if needed
export { requireAuth };
