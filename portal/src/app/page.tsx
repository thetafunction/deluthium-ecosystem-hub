'use client';

import { 
  Activity, 
  TrendingUp, 
  Download, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { UptimeStatus } from '@/components/UptimeStatus';
import { LatencyChart } from '@/components/LatencyChart';
import { RecentActivity } from '@/components/RecentActivity';

// Mock data for dashboard
const stats = [
  {
    title: 'API Uptime',
    value: '99.98%',
    change: '+0.02%',
    trend: 'up' as const,
    icon: Activity,
  },
  {
    title: 'Avg Latency',
    value: '42ms',
    change: '-5ms',
    trend: 'up' as const,
    icon: Clock,
  },
  {
    title: '24h Volume',
    value: '$12.5M',
    change: '+15.3%',
    trend: 'up' as const,
    icon: TrendingUp,
  },
  {
    title: 'Active MMs',
    value: '24',
    change: '+2',
    trend: 'up' as const,
    icon: Users,
  },
];

const endpoints = [
  { name: 'REST API', url: 'rfq-api.deluthium.ai', status: 'healthy' as const, uptime: 99.98 },
  { name: 'WebSocket Hub', url: 'mmhub.deluthium.ai', status: 'healthy' as const, uptime: 99.95 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of Deluthium ecosystem health and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uptime Status */}
        <div className="lg:col-span-1">
          <UptimeStatus endpoints={endpoints} />
        </div>

        {/* Latency Chart */}
        <div className="lg:col-span-2">
          <LatencyChart />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
