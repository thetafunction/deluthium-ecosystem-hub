import { Express, Request, Response } from 'express';
import { HealthChecker } from './health-checker';
import { LatencyTracker } from './latency-tracker';
import { MetricsStore } from './metrics-store';
import { logger } from './logger';

interface RouterOptions {
  healthChecker: HealthChecker;
  latencyTracker: LatencyTracker;
  metricsStore: MetricsStore;
}

export function setupRoutes(app: Express, options: RouterOptions): void {
  const { healthChecker, latencyTracker, metricsStore } = options;

  // Get all health statuses
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const statuses = await metricsStore.getAllHealthStatus();
      res.json({ data: statuses });
    } catch (error) {
      logger.error('Failed to get health status', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get health status for specific endpoint
  app.get('/api/health/:endpoint', async (req: Request, res: Response) => {
    try {
      const { endpoint } = req.params;
      const status = await metricsStore.getHealthStatus(endpoint);

      if (!status) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }

      res.json({ data: status });
    } catch (error) {
      logger.error('Failed to get health status', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Trigger manual health check
  app.post('/api/health/check', async (req: Request, res: Response) => {
    try {
      const results = await healthChecker.checkAll();
      res.json({ data: results });
    } catch (error) {
      logger.error('Failed to run health check', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get latency stats
  app.get('/api/latency', async (req: Request, res: Response) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const endpoints = healthChecker.getEndpoints();
      
      const stats = await Promise.all(
        endpoints.map(async (ep) => ({
          endpoint: ep.name,
          stats: await metricsStore.getLatencyStats(ep.name, hours),
        }))
      );

      res.json({ data: stats });
    } catch (error) {
      logger.error('Failed to get latency stats', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get latency stats for specific endpoint
  app.get('/api/latency/:endpoint', async (req: Request, res: Response) => {
    try {
      const { endpoint } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;
      const stats = await metricsStore.getLatencyStats(endpoint, hours);
      res.json({ data: stats });
    } catch (error) {
      logger.error('Failed to get latency stats', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Trigger manual latency check
  app.post('/api/latency/check', async (req: Request, res: Response) => {
    try {
      const results = await latencyTracker.checkAll();
      res.json({ data: results });
    } catch (error) {
      logger.error('Failed to run latency check', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get uptime for all endpoints
  app.get('/api/uptime', async (req: Request, res: Response) => {
    try {
      const endpoints = healthChecker.getEndpoints();
      
      const uptimes = await Promise.all(
        endpoints.map(async (ep) => ({
          endpoint: ep.name,
          uptime24h: await metricsStore.getUptime(ep.name, 24),
          uptime7d: await metricsStore.getUptime(ep.name, 24 * 7),
          uptime30d: await metricsStore.getUptime(ep.name, 24 * 30),
        }))
      );

      res.json({ data: uptimes });
    } catch (error) {
      logger.error('Failed to get uptime', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get uptime for specific endpoint
  app.get('/api/uptime/:endpoint', async (req: Request, res: Response) => {
    try {
      const { endpoint } = req.params;
      
      const uptime = {
        endpoint,
        uptime24h: await metricsStore.getUptime(endpoint, 24),
        uptime7d: await metricsStore.getUptime(endpoint, 24 * 7),
        uptime30d: await metricsStore.getUptime(endpoint, 24 * 30),
      };

      res.json({ data: uptime });
    } catch (error) {
      logger.error('Failed to get uptime', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Dashboard summary endpoint
  app.get('/api/dashboard', async (req: Request, res: Response) => {
    try {
      const endpoints = healthChecker.getEndpoints();
      
      const [healthStatuses, uptimes] = await Promise.all([
        metricsStore.getAllHealthStatus(),
        Promise.all(
          endpoints.map(async (ep) => ({
            endpoint: ep.name,
            uptime24h: await metricsStore.getUptime(ep.name, 24),
          }))
        ),
      ]);

      // Calculate overall stats
      const healthyCount = healthStatuses.filter((s) => s.status === 'healthy').length;
      const overallStatus = healthyCount === healthStatuses.length
        ? 'healthy'
        : healthyCount > 0
        ? 'degraded'
        : 'down';

      const avgUptime = uptimes.reduce((sum, u) => sum + u.uptime24h, 0) / uptimes.length;

      res.json({
        data: {
          overallStatus,
          avgUptime24h: Math.round(avgUptime * 100) / 100,
          endpoints: healthStatuses.map((status) => {
            const uptime = uptimes.find((u) => u.endpoint === status.endpoint);
            return {
              ...status,
              uptime24h: uptime?.uptime24h || 0,
            };
          }),
        },
      });
    } catch (error) {
      logger.error('Failed to get dashboard data', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
