'use client';

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Endpoint {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
}

interface UptimeStatusProps {
  endpoints: Endpoint[];
}

const statusConfig = {
  healthy: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    label: 'Healthy',
  },
  degraded: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    label: 'Degraded',
  },
  down: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    label: 'Down',
  },
};

export function UptimeStatus({ endpoints }: UptimeStatusProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h3>
      
      <div className="space-y-4">
        {endpoints.map((endpoint) => {
          const config = statusConfig[endpoint.status];
          const StatusIcon = config.icon;
          
          return (
            <div
              key={endpoint.name}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg',
                config.bgColor
              )}
            >
              <div className="flex items-center space-x-3">
                <StatusIcon className={cn('w-5 h-5', config.color)} />
                <div>
                  <p className="font-medium text-gray-900">{endpoint.name}</p>
                  <p className="text-sm text-gray-500">{endpoint.url}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-medium', config.color)}>
                  {config.label}
                </p>
                <p className="text-sm text-gray-500">
                  {endpoint.uptime.toFixed(2)}% uptime
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Uptime bars */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>30 day uptime</span>
          <span>Today</span>
        </div>
        <div className="flex space-x-0.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-8 flex-1 rounded-sm transition-colors',
                Math.random() > 0.02 ? 'bg-green-400 hover:bg-green-500' : 'bg-red-400 hover:bg-red-500'
              )}
              title={`Day ${30 - i}: ${Math.random() > 0.02 ? '100%' : '99.5%'} uptime`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
