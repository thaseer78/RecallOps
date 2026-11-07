import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createIncidentRouter } from './routes/incidents';
import { createMemoryRouter } from './routes/memories';
import { createActivityRouter } from './routes/activity';
import { createSettingsRouter } from './routes/settings';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Security & parsing middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === FRONTEND_URL ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('recall-ops')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'RecallOps Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api/incidents', createIncidentRouter());
app.use('/api/memories', createMemoryRouter());
app.use('/api/activity', createActivityRouter());
app.use('/api/settings', createSettingsRouter());

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`RecallOps backend running on port ${PORT}`);
  logger.info(`Frontend URL: ${FRONTEND_URL}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Hindsight: ${process.env.HINDSIGHT_API_KEY ? 'configured' : 'NOT configured — demo mode'}`);
  logger.info(`Groq: ${process.env.GROQ_API_KEY ? 'configured' : 'NOT configured — demo mode'}`);
});

export default app;

