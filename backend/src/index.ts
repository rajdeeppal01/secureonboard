import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import { webhookRouter } from './routes/webhooks';
import { employeeRouter } from './routes/employees';
import { integrationRouter } from './routes/integrations';
import { auditRouter } from './routes/audit';
import { organizationRouter } from './routes/organizations';
import { clerkAuth, requireOrgContext } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
    ].filter(Boolean);
    // Allow any vercel.app subdomain
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// Clerk auth — validates JWT on every request
app.use(clerkAuth);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes — all protected by requireOrgContext which validates the JWT
// and attaches req.orgId from the Clerk user's organization
app.use('/api/webhooks', requireOrgContext, webhookRouter);
app.use('/api/employees', requireOrgContext, employeeRouter);
app.use('/api/integrations', requireOrgContext, integrationRouter);
app.use('/api/audit', requireOrgContext, auditRouter);
app.use('/api/organizations', requireOrgContext, organizationRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const portNumber = Number(PORT) || 4000;

app.listen(portNumber, '0.0.0.0', () => {
  console.log(`🛡️  SecureOnboard API running on http://0.0.0.0:${portNumber}`);
  console.log(`📊  Health check: http://0.0.0.0:${portNumber}/health`);
});

export default app;
