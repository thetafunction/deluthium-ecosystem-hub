'use client';

import { BookOpen, ExternalLink, FileText, Code, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

const docSections = [
  {
    title: 'Getting Started',
    icon: Zap,
    links: [
      { name: 'Quick Start Guide', href: '/docs/QUICK_START.md', description: 'Get up and running in 5 minutes' },
      { name: 'API Reference', href: '/docs/API_REFERENCE.md', description: 'Complete API documentation' },
      { name: 'Authentication', href: '/docs/AUTH.md', description: 'JWT token and security' },
    ],
  },
  {
    title: 'Adapters',
    icon: Code,
    links: [
      { name: 'CCXT Integration', href: '/docs/adapters/CCXT.md', description: 'Unified exchange library' },
      { name: 'Hummingbot Connector', href: '/docs/adapters/HUMMINGBOT.md', description: 'Algorithmic trading' },
      { name: '0x Protocol Adapter', href: '/docs/adapters/ZEROX.md', description: '0x v4 RFQ translation' },
      { name: '1inch Adapter', href: '/docs/adapters/ONEINCH.md', description: 'Limit Order V4' },
      { name: 'Price Oracle', href: '/docs/adapters/ORACLE.md', description: '1inch aggregator oracle' },
    ],
  },
  {
    title: 'Market Makers',
    icon: Shield,
    links: [
      { name: 'MM Integration Guide', href: '/docs/MM_GUIDE.md', description: 'Complete MM onboarding' },
      { name: 'WebSocket Protocol', href: '/docs/WS_PROTOCOL.md', description: 'Protobuf messaging' },
      { name: 'EIP-712 Signing', href: '/docs/SIGNING.md', description: 'Quote signing guide' },
      { name: 'Best Practices', href: '/docs/BEST_PRACTICES.md', description: 'Production patterns' },
    ],
  },
];

const externalDocs = [
  {
    name: 'GitHub Repository',
    href: 'https://github.com/thetafunction/deluthium-Ecosystem-Hub',
    icon: ExternalLink,
  },
  {
    name: 'API Status',
    href: 'https://status.deluthium.ai',
    icon: ExternalLink,
  },
  {
    name: 'Deluthium Website',
    href: 'https://deluthium.ai',
    icon: ExternalLink,
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
        <p className="text-gray-500 mt-1">
          Everything you need to integrate with Deluthium
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search documentation..."
          className="w-full px-4 py-3 pl-12 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-deluthium-500 focus:border-transparent"
        />
        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/docs/QUICK_START.md"
          className="flex items-center p-4 bg-deluthium-50 border border-deluthium-200 rounded-xl hover:bg-deluthium-100 transition-colors"
        >
          <Zap className="w-8 h-8 text-deluthium-600 mr-4" />
          <div>
            <h3 className="font-semibold text-gray-900">Quick Start</h3>
            <p className="text-sm text-gray-500">Get started in minutes</p>
          </div>
        </a>
        <a
          href="/docs/API_REFERENCE.md"
          className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
        >
          <Code className="w-8 h-8 text-purple-600 mr-4" />
          <div>
            <h3 className="font-semibold text-gray-900">API Reference</h3>
            <p className="text-sm text-gray-500">Complete API docs</p>
          </div>
        </a>
        <a
          href="/docs/MM_GUIDE.md"
          className="flex items-center p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
        >
          <Shield className="w-8 h-8 text-green-600 mr-4" />
          <div>
            <h3 className="font-semibold text-gray-900">MM Guide</h3>
            <p className="text-sm text-gray-500">Become a market maker</p>
          </div>
        </a>
      </div>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {docSections.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center mb-4">
              <section.icon className="w-5 h-5 text-deluthium-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            </div>
            <div className="space-y-3">
              {section.links.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{link.name}</span>
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{link.description}</p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* External Links */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">External Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {externalDocs.map((doc) => (
            <a
              key={doc.name}
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">{doc.name}</span>
              <doc.icon className="w-4 h-4 text-gray-400" />
            </a>
          ))}
        </div>
      </div>

      {/* API Endpoints Quick Reference */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-500">Endpoint</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Method</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3"><code className="text-sm">/v1/quote/indicative</code></td>
                <td className="py-3"><span className="text-blue-600">POST</span></td>
                <td className="py-3 text-gray-600">Get estimated price</td>
              </tr>
              <tr>
                <td className="py-3"><code className="text-sm">/v1/quote/firm</code></td>
                <td className="py-3"><span className="text-blue-600">POST</span></td>
                <td className="py-3 text-gray-600">Get binding quote with calldata</td>
              </tr>
              <tr>
                <td className="py-3"><code className="text-sm">/v1/listing/pairs</code></td>
                <td className="py-3"><span className="text-green-600">GET</span></td>
                <td className="py-3 text-gray-600">Get trading pairs</td>
              </tr>
              <tr>
                <td className="py-3"><code className="text-sm">/v1/listing/tokens</code></td>
                <td className="py-3"><span className="text-green-600">GET</span></td>
                <td className="py-3 text-gray-600">Get supported tokens</td>
              </tr>
              <tr>
                <td className="py-3"><code className="text-sm">/v1/market/pair</code></td>
                <td className="py-3"><span className="text-green-600">GET</span></td>
                <td className="py-3 text-gray-600">Get market data</td>
              </tr>
              <tr>
                <td className="py-3"><code className="text-sm">/v1/market/klines</code></td>
                <td className="py-3"><span className="text-green-600">GET</span></td>
                <td className="py-3 text-gray-600">Get OHLCV data</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Base URL: <code className="bg-gray-100 px-2 py-0.5 rounded">https://rfq-api.deluthium.ai</code>
        </p>
      </div>
    </div>
  );
}
