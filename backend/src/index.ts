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

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/webhooks', webhookRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/integrations', integrationRouter);
app.use('/api/audit', auditRouter);
app.use('/api/organizations', organizationRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🛡️  SecureOnboard API running on http://localhost:${PORT}`);
  console.log(`📊  Health check: http://localhost:${PORT}/health`);
});

export default app;
