'use client';

import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
}

export function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-deluthium-50 rounded-lg">
          <Icon className="w-6 h-6 text-deluthium-600" />
        </div>
        <div
          className={cn(
            'flex items-center text-sm font-medium',
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          )}
        >
          {trend === 'up' ? (
            <ArrowUpRight className="w-4 h-4 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 mr-1" />
          )}
          {change}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
