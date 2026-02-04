import Redis from 'ioredis';
import { Pool } from 'pg';
import { logger } from './logger';
import { HealthCheckResult } from './health-checker';
import { LatencyResult } from './latency-tracker';

export type HealthStatus = 'healthy' | 'degraded' | 'down';

interface MetricsStoreOptions {
  redisUrl: string;
  databaseUrl?: string;
}

export class MetricsStore {
  private redis: Redis;
  private pg?: Pool;
  private initialized: boolean = false;

  constructor(options: MetricsStoreOptions) {
    this.redis = new Redis(options.redisUrl);

    if (options.databaseUrl) {
      this.pg = new Pool({ connectionString: options.databaseUrl });
    }
  }

  async initialize(): Promise<void> {
    try {
      // Test Redis connection
      await this.redis.ping();
      logger.info('Redis connection established');

      // Test PostgreSQL connection if configured
      if (this.pg) {
        const client = await this.pg.connect();
        await client.query('SELECT 1');
        client.release();
        logger.info('PostgreSQL connection established');

        // Create tables if they don't exist
        await this.createTables();
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize metrics store', { error });
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.pg) return;

    await this.pg.query(`
      CREATE TABLE IF NOT EXISTS health_checks (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        latency_ms INTEGER NOT NULL,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS latency_metrics (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        latency_ms INTEGER NOT NULL,
        success BOOLEAN NOT NULL,
        status_code INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_health_checks_endpoint ON health_checks(endpoint);
      CREATE INDEX IF NOT EXISTS idx_health_checks_created_at ON health_checks(created_at);
      CREATE INDEX IF NOT EXISTS idx_latency_metrics_endpoint ON latency_metrics(endpoint);
      CREATE INDEX IF NOT EXISTS idx_latency_metrics_created_at ON latency_metrics(created_at);
    `);

    logger.info('Database tables created/verified');
  }

  async recordHealthCheck(result: HealthCheckResult): Promise<void> {
    // Store in Redis for real-time access
    const key = `health:${result.endpoint}`;
    await this.redis.hset(key, {
      status: result.status,
      latencyMs: result.latencyMs.toString(),
      timestamp: result.timestamp.toISOString(),
      error: result.error || '',
    });

    // Store health check history in Redis list (keep last 100)
    const historyKey = `health_history:${result.endpoint}`;
    await this.redis.lpush(historyKey, JSON.stringify(result));
    await this.redis.ltrim(historyKey, 0, 99);

    // Persist to PostgreSQL if available
    if (this.pg) {
      await this.pg.query(
        `INSERT INTO health_checks (endpoint, status, latency_ms, error) VALUES ($1, $2, $3, $4)`,
        [result.endpoint, result.status, result.latencyMs, result.error]
      );
    }
  }

  async recordLatency(result: LatencyResult): Promise<void> {
    // Store in Redis sorted set for percentile calculations
    const key = `latency:${result.endpoint}`;
    const timestamp = result.timestamp.getTime();
    await this.redis.zadd(key, timestamp, `${result.latencyMs}:${timestamp}`);

    // Remove entries older than 24 hours
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    await this.redis.zremrangebyscore(key, 0, cutoff);

    // Persist to PostgreSQL if available
    if (this.pg) {
      await this.pg.query(
        `INSERT INTO latency_metrics (endpoint, latency_ms, success, status_code) VALUES ($1, $2, $3, $4)`,
        [result.endpoint, result.latencyMs, result.success, result.statusCode]
      );
    }
  }

  async getHealthStatus(endpoint: string): Promise<HealthCheckResult | null> {
    const key = `health:${endpoint}`;
    const data = await this.redis.hgetall(key);

    if (!data.status) return null;

    return {
      endpoint,
      status: data.status as HealthStatus,
      latencyMs: parseInt(data.latencyMs, 10),
      timestamp: new Date(data.timestamp),
      error: data.error || undefined,
    };
  }

  async getAllHealthStatus(): Promise<HealthCheckResult[]> {
    const keys = await this.redis.keys('health:*');
    const results: HealthCheckResult[] = [];

    for (const key of keys) {
      const endpoint = key.replace('health:', '');
      const status = await this.getHealthStatus(endpoint);
      if (status) results.push(status);
    }

    return results;
  }

  async getLatencyStats(
    endpoint: string,
    hours: number = 24
  ): Promise<{
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    count: number;
  }> {
    const key = `latency:${endpoint}`;
    const cutoff = Date.now() - hours * 60 * 60 * 1000;

    // Get all latencies within time range
    const entries = await this.redis.zrangebyscore(key, cutoff, '+inf');
    const latencies = entries.map((e) => parseInt(e.split(':')[0], 10)).sort((a, b) => a - b);

    if (latencies.length === 0) {
      return { p50: 0, p95: 0, p99: 0, avg: 0, count: 0 };
    }

    const percentile = (arr: number[], p: number) => {
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, index)];
    };

    const sum = latencies.reduce((a, b) => a + b, 0);

    return {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      avg: Math.round(sum / latencies.length),
      count: latencies.length,
    };
  }

  async getUptime(endpoint: string, hours: number = 24): Promise<number> {
    if (!this.pg) {
      // Fallback to Redis history
      const key = `health_history:${endpoint}`;
      const entries = await this.redis.lrange(key, 0, -1);
      const results = entries.map((e) => JSON.parse(e) as HealthCheckResult);

      if (results.length === 0) return 100;

      const healthy = results.filter((r) => r.status === 'healthy').length;
      return Math.round((healthy / results.length) * 10000) / 100;
    }

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const result = await this.pg.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'healthy') as healthy
      FROM health_checks
      WHERE endpoint = $1 AND created_at >= $2`,
      [endpoint, cutoff]
    );

    const { total, healthy } = result.rows[0];
    if (total === 0) return 100;

    return Math.round((healthy / total) * 10000) / 100;
  }

  async close(): Promise<void> {
    await this.redis.quit();
    if (this.pg) {
      await this.pg.end();
    }
  }
}
