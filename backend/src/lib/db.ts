/**
 * Unified data layer.
 * - When DATABASE_URL is set → uses Prisma (production / real DB)
 * - When DATABASE_URL is missing → uses in-memory mock store (dev / demo)
 */

import { store as mockStore } from './mockStore';
import { prismaStore } from './prismaStore';

const USE_DB = !!process.env.DATABASE_URL;

if (USE_DB) {
  console.log('🗄️  Using Prisma (real database)');
} else {
  console.log('🧪  Using in-memory mock store (no DATABASE_URL set)');
}

export const db = USE_DB ? prismaStore : (mockStore as unknown as typeof prismaStore);
