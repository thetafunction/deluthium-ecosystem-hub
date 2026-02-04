'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Generate mock data for the last 24 hours
function generateMockData() {
  const data = [];
  const now = new Date();
  
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      p50: Math.floor(Math.random() * 20) + 30,
      p95: Math.floor(Math.random() * 30) + 50,
      p99: Math.floor(Math.random() * 50) + 70,
    });
  }
  
  return data;
}

export function LatencyChart() {
  const data = useMemo(() => generateMockData(), []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Latency</h3>
          <p className="text-sm text-gray-500">Response time over the last 24 hours</p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-deluthium-500 mr-2"></div>
            <span className="text-gray-600">P50</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-gray-600">P95</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-gray-600">P99</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              unit="ms"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
              name="P50"
            />
            <Line
              type="monotone"
              dataKey="p95"
              stroke="#eab308"
              strokeWidth={2}
              dot={false}
              name="P95"
            />
            <Line
              type="monotone"
              dataKey="p99"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="P99"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
