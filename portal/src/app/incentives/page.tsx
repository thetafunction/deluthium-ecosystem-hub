'use client';

import { useState } from 'react';
import { Trophy, TrendingUp, Gift, Medal, Crown, Award } from 'lucide-react';
import { cn, shortenAddress, formatCurrency } from '@/lib/utils';

interface MarketMaker {
  rank: number;
  address: string;
  volume24h: number;
  volume7d: number;
  volumeTotal: number;
  quoteAcceptRate: number;
  avgLatencyMs: number;
  pendingRebates: number;
}

const leaderboard: MarketMaker[] = [
  {
    rank: 1,
    address: '0x7a3fB5F8C9dE4b2a1c6e3D9f8E2b5A4c7D1E3F6A',
    volume24h: 2500000,
    volume7d: 15000000,
    volumeTotal: 125000000,
    quoteAcceptRate: 98.5,
    avgLatencyMs: 28,
    pendingRebates: 12500,
  },
  {
    rank: 2,
    address: '0x8b2cA6D9E1f3B5c7A4d8E6F2C9b1D3e5A7F8B2C4',
    volume24h: 1800000,
    volume7d: 12000000,
    volumeTotal: 98000000,
    quoteAcceptRate: 97.2,
    avgLatencyMs: 32,
    pendingRebates: 9800,
  },
  {
    rank: 3,
    address: '0x9c1dB7E0F2a4C6d8B5e7A3F1D9c2E4b6A8F0C1D3',
    volume24h: 1500000,
    volume7d: 9500000,
    volumeTotal: 75000000,
    quoteAcceptRate: 96.8,
    avgLatencyMs: 35,
    pendingRebates: 7500,
  },
  {
    rank: 4,
    address: '0xAd2eC8F1a3B5D7e9C6f8A2E4b6D0c3F5A7B9D1E3',
    volume24h: 1200000,
    volume7d: 7800000,
    volumeTotal: 62000000,
    quoteAcceptRate: 95.5,
    avgLatencyMs: 38,
    pendingRebates: 6200,
  },
  {
    rank: 5,
    address: '0xBe3fD9a2B4c6E8f0A7d9C1E3b5F7A9c2D4E6f8A0',
    volume24h: 950000,
    volume7d: 6200000,
    volumeTotal: 48000000,
    quoteAcceptRate: 94.2,
    avgLatencyMs: 42,
    pendingRebates: 4800,
  },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-gray-500 font-medium">#{rank}</span>;
  }
};

export default function IncentivesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | 'all'>('7d');
  
  // Mock user stats (would come from API)
  const myStats = {
    rank: 4,
    volume24h: 1200000,
    volume7d: 7800000,
    pendingRebates: 6200,
    claimedRebates: 45000,
    quoteAcceptRate: 95.5,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Incentives Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Track your performance, rankings, and rewards
        </p>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-deluthium-500 to-deluthium-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">#{myStats.rank}</span>
          </div>
          <p className="text-deluthium-100">Your Rank</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(myStats.volume7d)}
          </p>
          <p className="text-gray-500 text-sm">7d Volume</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Gift className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(myStats.pendingRebates)}
          </p>
          <p className="text-gray-500 text-sm">Pending Rebates</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {myStats.quoteAcceptRate}%
          </p>
          <p className="text-gray-500 text-sm">Accept Rate</p>
        </div>
      </div>

      {/* Rebates Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your Rebates</h3>
            <p className="text-sm text-gray-500">Earn rebates based on your trading volume</p>
          </div>
          <button className="px-4 py-2 bg-deluthium-600 text-white rounded-lg hover:bg-deluthium-700 transition-colors font-medium">
            Claim All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(myStats.pendingRebates)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Total Claimed</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(myStats.claimedRebates)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Rebate Rate</p>
            <p className="text-2xl font-bold text-deluthium-600">0.05%</p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Top Market Makers</h3>
          <div className="flex space-x-2">
            {(['24h', '7d', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                  selectedPeriod === period
                    ? 'bg-deluthium-100 text-deluthium-700'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                {period === 'all' ? 'All Time' : period.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  24h Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  7d Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accept Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rebates
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((mm) => (
                <tr 
                  key={mm.address} 
                  className={cn(
                    'hover:bg-gray-50',
                    mm.rank <= 3 && 'bg-gradient-to-r from-yellow-50/50 to-transparent'
                  )}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(mm.rank)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {shortenAddress(mm.address, 6)}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(mm.volume24h)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(mm.volume7d)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'text-sm font-medium',
                      mm.quoteAcceptRate >= 97 ? 'text-green-600' : 'text-yellow-600'
                    )}>
                      {mm.quoteAcceptRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mm.avgLatencyMs}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                    {formatCurrency(mm.pendingRebates)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
