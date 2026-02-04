import { logger } from './logger';
import { MetricsStore } from './metrics-store';

export interface LatencyEndpoint {
  name: string;
  path: string;
  method?: 'GET' | 'POST';
  body?: object;
}

export interface LatencyResult {
  endpoint: string;
  latencyMs: number;
  timestamp: Date;
  success: boolean;
  statusCode?: number;
}

interface LatencyTrackerOptions {
  endpoints: LatencyEndpoint[];
  baseUrl: string;
  jwtToken?: string;
  metricsStore: MetricsStore;
  timeoutMs?: number;
}

export class LatencyTracker {
  private endpoints: LatencyEndpoint[];
  private baseUrl: string;
  private jwtToken?: string;
  private metricsStore: MetricsStore;
  private timeoutMs: number;

  constructor(options: LatencyTrackerOptions) {
    this.endpoints = options.endpoints;
    this.baseUrl = options.baseUrl;
    this.jwtToken = options.jwtToken;
    this.metricsStore = options.metricsStore;
    this.timeoutMs = options.timeoutMs || 30000;
  }

  async checkAll(): Promise<LatencyResult[]> {
    const results: LatencyResult[] = [];

    for (const endpoint of this.endpoints) {
      const result = await this.checkEndpoint(endpoint);
      results.push(result);
      await this.metricsStore.recordLatency(result);
    }

    return results;
  }

  async checkEndpoint(endpoint: LatencyEndpoint): Promise<LatencyResult> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint.path}`;
    const method = endpoint.method || 'GET';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.jwtToken) {
        headers['Authorization'] = `Bearer ${this.jwtToken}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      return {
        endpoint: endpoint.name,
        latencyMs,
        timestamp: new Date(),
        success: response.ok,
        statusCode: response.status,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      logger.error(`Latency check failed for ${endpoint.name}`, { error });

      return {
        endpoint: endpoint.name,
        latencyMs,
        timestamp: new Date(),
        success: false,
      };
    }
  }

  async getStats(endpoint: string, hours: number = 24): Promise<{
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    count: number;
  }> {
    return this.metricsStore.getLatencyStats(endpoint, hours);
  }
}
