'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Activity, 
  Trophy, 
  Download,
  BookOpen,
  Settings,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'API Monitor', href: '/monitor', icon: Activity },
  { name: 'Incentives', href: '/incentives', icon: Trophy },
  { name: 'Downloads', href: '/downloads', icon: Download },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
];

const externalLinks = [
  { name: 'Swap Plus', href: 'https://deluthium.ai/en/swap-plus', icon: ExternalLink },
  { name: 'GitHub', href: 'https://github.com/thetafunction/deluthium-Ecosystem-Hub', icon: ExternalLink },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-deluthium-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Deluthium</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-deluthium-50 text-deluthium-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            External
          </p>
          <div className="mt-2 space-y-1">
            {externalLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center px-3 py-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          All systems operational
        </div>
      </div>
    </div>
  );
}
