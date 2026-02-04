'use client';

import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'trade' | 'quote' | 'error';
  message: string;
  timestamp: Date;
  metadata?: {
    volume?: string;
    pair?: string;
  };
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'trade',
    message: 'Trade executed successfully',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    metadata: { volume: '$25,000', pair: 'WBNB/USDT' },
  },
  {
    id: '2',
    type: 'quote',
    message: 'Quote provided by MM-0x7a3...',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    metadata: { pair: 'WETH/USDC' },
  },
  {
    id: '3',
    type: 'trade',
    message: 'Cross-chain swap completed',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    metadata: { volume: '$15,500', pair: 'BNB/ETH' },
  },
  {
    id: '4',
    type: 'error',
    message: 'Quote timeout - MM-0x8b2... did not respond',
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: '5',
    type: 'quote',
    message: 'New market maker connected',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
];

const activityConfig = {
  trade: {
    icon: ArrowUpRight,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  quote: {
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  error: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

export function RecentActivity() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-sm text-deluthium-600 hover:text-deluthium-700 font-medium">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {mockActivities.map((activity) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;

          return (
            <div
              key={activity.id}
              className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={cn('p-2 rounded-lg', config.bgColor)}>
                <Icon className={cn('w-4 h-4', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.message}
                </p>
                {activity.metadata && (
                  <div className="flex items-center space-x-2 mt-1">
                    {activity.metadata.pair && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {activity.metadata.pair}
                      </span>
                    )}
                    {activity.metadata.volume && (
                      <span className="text-xs text-gray-500">
                        {activity.metadata.volume}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
