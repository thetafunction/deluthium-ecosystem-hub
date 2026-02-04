import WebSocket from 'ws';
import { logger } from './logger';
import { MetricsStore, HealthStatus } from './metrics-store';

export interface EndpointConfig {
  name: string;
  url: string;
  type: 'http' | 'websocket';
}

export interface HealthCheckResult {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  timestamp: Date;
  error?: string;
}

interface HealthCheckerOptions {
  endpoints: EndpointConfig[];
  metricsStore: MetricsStore;
  timeoutMs?: number;
}

export class HealthChecker {
  private endpoints: EndpointConfig[];
  private metricsStore: MetricsStore;
  private timeoutMs: number;

  constructor(options: HealthCheckerOptions) {
    this.endpoints = options.endpoints;
    this.metricsStore = options.metricsStore;
    this.timeoutMs = options.timeoutMs || 10000;
  }

  async checkAll(): Promise<HealthCheckResult[]> {
    const results = await Promise.all(
      this.endpoints.map((endpoint) => this.checkEndpoint(endpoint))
    );

    // Store results
    for (const result of results) {
      await this.metricsStore.recordHealthCheck(result);
    }

    return results;
  }

  async checkEndpoint(endpoint: EndpointConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (endpoint.type === 'http') {
        return await this.checkHttpEndpoint(endpoint, startTime);
      } else {
        return await this.checkWebSocketEndpoint(endpoint, startTime);
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      logger.error(`Health check failed for ${endpoint.name}`, { error });

      return {
        endpoint: endpoint.name,
        status: 'down',
        latencyMs,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkHttpEndpoint(
    endpoint: EndpointConfig,
    startTime: number
  ): Promise<HealthCheckResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'down';
      if (response.ok) {
        status = latencyMs < 1000 ? 'healthy' : 'degraded';
      } else {
        status = response.status >= 500 ? 'down' : 'degraded';
      }

      return {
        endpoint: endpoint.name,
        status,
        latencyMs,
        timestamp: new Date(),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async checkWebSocketEndpoint(
    endpoint: EndpointConfig,
    startTime: number
  ): Promise<HealthCheckResult> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        ws.close();
        resolve({
          endpoint: endpoint.name,
          status: 'down',
          latencyMs: this.timeoutMs,
          timestamp: new Date(),
          error: 'Connection timeout',
        });
      }, this.timeoutMs);

      const ws = new WebSocket(endpoint.url);

      ws.on('open', () => {
        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;
        ws.close();

        resolve({
          endpoint: endpoint.name,
          status: latencyMs < 500 ? 'healthy' : 'degraded',
          latencyMs,
          timestamp: new Date(),
        });
      });

      ws.on('error', (error) => {
        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        resolve({
          endpoint: endpoint.name,
          status: 'down',
          latencyMs,
          timestamp: new Date(),
          error: error.message,
        });
      });
    });
  }

  getEndpoints(): EndpointConfig[] {
    return this.endpoints;
  }
}
