'use client';

import { useState } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  Terminal,
  FileCode,
  Package,
  Github
} from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';

interface Integration {
  name: string;
  description: string;
  languages: string[];
  dockerImage: string;
  githubUrl: string;
  docsUrl: string;
  icon: string;
  category: 'consumer' | 'provider';
}

const integrations: Integration[] = [
  {
    name: 'CCXT Deluthium',
    description: 'Unified crypto exchange library with Deluthium support. Access markets, quotes, and execute trades using a standardized interface.',
    languages: ['Python', 'TypeScript', 'PHP', 'Go', 'C#'],
    dockerImage: 'deluthium/ccxt:latest',
    githubUrl: 'https://github.com/ccxt/ccxt',
    docsUrl: '/docs/adapters/CCXT.md',
    icon: '📊',
    category: 'consumer',
  },
  {
    name: 'Hummingbot Connector',
    description: 'Algorithmic trading bot connector for automated market making and arbitrage strategies on Deluthium.',
    languages: ['Python'],
    dockerImage: 'deluthium/hummingbot:latest',
    githubUrl: 'https://github.com/hummingbot/hummingbot',
    docsUrl: '/docs/adapters/HUMMINGBOT.md',
    icon: '🤖',
    category: 'consumer',
  },
  {
    name: '0x Protocol Adapter',
    description: 'Translate 0x Protocol v4 RFQ orders to Deluthium format. Ideal for existing 0x market makers.',
    languages: ['TypeScript'],
    dockerImage: 'deluthium/0x-adapter:latest',
    githubUrl: 'https://github.com/thetafunction/0x-deluthium-adapter',
    docsUrl: '/docs/adapters/ZEROX.md',
    icon: '🔄',
    category: 'consumer',
  },
  {
    name: '1inch Limit Order Adapter',
    description: 'Production-ready adapter for 1inch Limit Order Protocol V4. Includes signer abstraction and validation.',
    languages: ['TypeScript', 'Solidity'],
    dockerImage: 'deluthium/1inch-adapter:latest',
    githubUrl: 'https://github.com/thetafunction/1inch-deluthium-adapter',
    docsUrl: '/docs/adapters/ONEINCH.md',
    icon: '🦄',
    category: 'consumer',
  },
  {
    name: 'Market Maker Example',
    description: 'Reference implementation for WebSocket-based quote providers. Learn how to become a market maker.',
    languages: ['Go'],
    dockerImage: 'deluthium/mm-example:latest',
    githubUrl: 'https://github.com/thetafunction/DarkPool-Market-Maker-Example',
    docsUrl: '/docs/MM_GUIDE.md',
    icon: '💹',
    category: 'provider',
  },
  {
    name: 'Deluthium Oracle',
    description: 'Price oracle contract for 1inch spot price aggregator integration. Push prices on-chain.',
    languages: ['Solidity'],
    dockerImage: '',
    githubUrl: 'https://github.com/thetafunction/1inch-deluthium-adapter',
    docsUrl: '/docs/adapters/ORACLE.md',
    icon: '🔮',
    category: 'provider',
  },
];

function DownloadCard({ integration }: { integration: Integration }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!integration.dockerImage) return;
    await copyToClipboard(`docker pull ${integration.dockerImage}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{integration.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{integration.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {integration.languages.map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

      {/* Docker Command */}
      {integration.dockerImage && (
        <div className="mb-4">
          <div className="flex items-center justify-between bg-gray-900 text-gray-100 px-4 py-3 rounded-lg">
            <code className="text-sm font-mono truncate">
              docker pull {integration.dockerImage}
            </code>
            <button
              onClick={handleCopy}
              className="ml-2 p-1 hover:bg-gray-800 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-3">
        <a
          href={integration.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Github className="w-4 h-4 mr-2" />
          Source
        </a>
        <a
          href={integration.docsUrl}
          className="flex items-center px-3 py-2 text-sm font-medium text-deluthium-700 bg-deluthium-50 rounded-lg hover:bg-deluthium-100 transition-colors"
        >
          <FileCode className="w-4 h-4 mr-2" />
          Docs
        </a>
        {integration.dockerImage && (
          <button
            onClick={handleCopy}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-deluthium-600 rounded-lg hover:bg-deluthium-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Docker
          </button>
        )}
      </div>
    </div>
  );
}

export default function DownloadsPage() {
  const consumers = integrations.filter((i) => i.category === 'consumer');
  const providers = integrations.filter((i) => i.category === 'provider');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Downloads</h1>
        <p className="text-gray-500 mt-1">
          One-click downloads for all Deluthium integrations
        </p>
      </div>

      {/* Quick Start */}
      <div className="bg-gradient-to-r from-deluthium-600 to-deluthium-700 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Quick Start</h2>
            <p className="text-deluthium-100 mb-4">
              Get everything running with a single command
            </p>
            <div className="bg-black/20 rounded-lg px-4 py-3 font-mono text-sm">
              curl -sSL https://raw.githubusercontent.com/thetafunction/deluthium-Ecosystem-Hub/main/scripts/setup.sh | bash
            </div>
          </div>
          <Terminal className="w-12 h-12 opacity-50" />
        </div>
      </div>

      {/* Quote Consumers */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-deluthium-600" />
          Quote Consumers
          <span className="ml-2 text-sm font-normal text-gray-500">
            For traders and aggregators
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {consumers.map((integration) => (
            <DownloadCard key={integration.name} integration={integration} />
          ))}
        </div>
      </div>

      {/* Quote Providers */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-purple-600" />
          Quote Providers
          <span className="ml-2 text-sm font-normal text-gray-500">
            For market makers
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers.map((integration) => (
            <DownloadCard key={integration.name} integration={integration} />
          ))}
        </div>
      </div>

      {/* Installation Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Alternative Installation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">NPM</h4>
            <code className="text-sm text-gray-600">npm install ccxt</code>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">PyPI</h4>
            <code className="text-sm text-gray-600">pip install ccxt</code>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Composer</h4>
            <code className="text-sm text-gray-600">composer require ccxt/ccxt</code>
          </div>
        </div>
      </div>
    </div>
  );
}
