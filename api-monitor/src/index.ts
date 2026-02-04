import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { logger } from './logger';
import { HealthChecker } from './health-checker';
import { LatencyTracker } from './latency-tracker';
import { MetricsStore } from './metrics-store';
import { setupRoutes } from './routes';
import { apiKeyAuth, rateLimit } from './middleware/auth';
import cron from 'node-cron';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimit);      // Rate limiting for all requests
app.use(apiKeyAuth);     // API key authentication (skips public paths)

// Initialize services
const metricsStore = new MetricsStore({
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  databaseUrl: process.env.DATABASE_URL,
});

const healthChecker = new HealthChecker({
  endpoints: [
    {
      name: 'REST API',
      url: process.env.REST_API_URL || 'https://rfq-api.deluthium.ai',
      type: 'http',
    },
    {
      name: 'WebSocket Hub',
      url: process.env.WS_URL || 'wss://mmhub.deluthium.ai/ws',
      type: 'websocket',
    },
  ],
  metricsStore,
});

const latencyTracker = new LatencyTracker({
  endpoints: [
    { name: 'indicative', path: '/v1/quote/indicative' },
    { name: 'firm', path: '/v1/quote/firm' },
    { name: 'pairs', path: '/v1/listing/pairs' },
    { name: 'tokens', path: '/v1/listing/tokens' },
  ],
  baseUrl: process.env.REST_API_URL || 'https://rfq-api.deluthium.ai',
  jwtToken: process.env.DELUTHIUM_JWT,
  metricsStore,
});

// Setup routes
setupRoutes(app, { healthChecker, latencyTracker, metricsStore });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Schedule health checks every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  logger.debug('Running scheduled health check');
  await healthChecker.checkAll();
});

// Schedule latency checks every minute
cron.schedule('* * * * *', async () => {
  logger.debug('Running scheduled latency check');
  await latencyTracker.checkAll();
});

// Start server
async function start() {
  try {
    // Initialize metrics store
    await metricsStore.initialize();
    logger.info('Metrics store initialized');

    // Run initial health check
    await healthChecker.checkAll();
    logger.info('Initial health check completed');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`API Monitor server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();
