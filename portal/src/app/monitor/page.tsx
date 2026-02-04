'use client';

import { useState } from 'react';
import { Activity, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { UptimeStatus } from '@/components/UptimeStatus';
import { LatencyChart } from '@/components/LatencyChart';
import { cn } from '@/lib/utils';

const endpoints = [
  { 
    name: 'REST API', 
    url: 'rfq-api.deluthium.ai', 
    status: 'healthy' as const, 
    uptime: 99.98,
    latency: { p50: 35, p95: 52, p99: 78 }
  },
  { 
    name: 'WebSocket Hub', 
    url: 'mmhub.deluthium.ai', 
    status: 'healthy' as const, 
    uptime: 99.95,
    latency: { p50: 12, p95: 28, p99: 45 }
  },
  { 
    name: 'Quote Service', 
    url: 'rfq-api.deluthium.ai/v1/quote', 
    status: 'healthy' as const, 
    uptime: 99.92,
    latency: { p50: 42, p95: 68, p99: 95 }
  },
];

const apiEndpoints = [
  { path: '/v1/quote/indicative', method: 'POST', avgLatency: 45, calls24h: 125000 },
  { path: '/v1/quote/firm', method: 'POST', avgLatency: 52, calls24h: 45000 },
  { path: '/v1/listing/pairs', method: 'GET', avgLatency: 28, calls24h: 8500 },
  { path: '/v1/listing/tokens', method: 'GET', avgLatency: 25, calls24h: 6200 },
  { path: '/v1/market/pair', method: 'GET', avgLatency: 32, calls24h: 18000 },
  { path: '/v1/market/klines', method: 'GET', avgLatency: 38, calls24h: 12000 },
];

export default function MonitorPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Monitor</h1>
          <p className="text-gray-500 mt-1">
            Real-time health and performance metrics
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {endpoints.map((endpoint) => (
          <div
            key={endpoint.name}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {endpoint.status === 'healthy' ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <h3 className="font-semibold text-gray-900">{endpoint.name}</h3>
              </div>
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  endpoint.status === 'healthy'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                )}
              >
                {endpoint.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">{endpoint.url}</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">P50</p>
                <p className="text-lg font-semibold text-gray-900">
                  {endpoint.latency.p50}ms
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">P95</p>
                <p className="text-lg font-semibold text-yellow-600">
                  {endpoint.latency.p95}ms
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">P99</p>
                <p className="text-lg font-semibold text-red-600">
                  {endpoint.latency.p99}ms
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Latency Chart */}
      <LatencyChart />

      {/* Endpoint Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">API Endpoints</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  24h Calls
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {apiEndpoints.map((endpoint) => (
                <tr key={endpoint.path} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-900">{endpoint.path}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded',
                        endpoint.method === 'GET'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      )}
                    >
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {endpoint.avgLatency}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {endpoint.calls24h.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm text-green-600">Healthy</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Last refresh */}
      <p className="text-sm text-gray-500 text-center">
        Last updated: {lastRefresh.toLocaleString()}
      </p>
    </div>
  );
}
