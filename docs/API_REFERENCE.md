# Deluthium API Reference

> Complete reference for the Deluthium RFQ API and WebSocket Hub

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [REST API](#rest-api)
  - [Base URLs](#base-urls)
  - [Common Headers](#common-headers)
  - [Endpoints](#endpoints)
- [WebSocket API](#websocket-api)
  - [Connection](#connection)
  - [Message Types](#message-types)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [Data Types](#data-types)

---

## Overview

Deluthium provides two main API interfaces:

1. **REST API** (`rfq-api.deluthium.ai`) - For quote consumers (traders, aggregators)
2. **WebSocket Hub** (`mmhub.deluthium.ai`) - For quote providers (market makers)

All requests require JWT authentication obtained from the Deluthium team.

---

## Authentication

All API requests require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Obtaining a JWT Token

Contact the Deluthium team at [https://deluthium.ai](https://deluthium.ai) to apply for API access.

### Token Format

JWT tokens follow the standard format: `xxxxx.yyyyy.zzzzz` (header.payload.signature)

---

## REST API

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://rfq-api.deluthium.ai` |

### Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token for authentication |
| `Content-Type` | Yes | `application/json` for POST requests |
| `X-Chain-Id` | No | Chain ID (defaults to 56 for BSC) |

### Endpoints

#### Get Supported Token Pairs

Retrieve all supported trading pairs on a specific chain.

```http
GET /v1/listing/pairs?chainId={chainId}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `chainId` | integer | Yes | Blockchain chain ID (e.g., 56 for BSC) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "baseToken": {
        "address": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        "symbol": "WBNB",
        "decimals": 18
      },
      "quoteToken": {
        "address": "0x55d398326f99059fF775485246999027B3197955",
        "symbol": "USDT",
        "decimals": 18
      },
      "minSize": "0.1",
      "maxSize": "1000"
    }
  ]
}
```

---

#### Get Supported Tokens

Retrieve all supported tokens on a specific chain.

```http
GET /v1/listing/tokens?chainId={chainId}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `chainId` | integer | Yes | Blockchain chain ID |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "address": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      "symbol": "WBNB",
      "name": "Wrapped BNB",
      "decimals": 18,
      "chainId": 56
    }
  ]
}
```

---

#### Get Indicative Quote

Get a non-binding indicative quote for a swap. Use this for price discovery.

```http
POST /v1/quote/indicative
```

**Request Body:**

```json
{
  "chainId": 56,
  "sellToken": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  "buyToken": "0x55d398326f99059fF775485246999027B3197955",
  "sellAmount": "1000000000000000000",
  "taker": "0xYourWalletAddress"
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `chainId` | integer | Yes | Blockchain chain ID |
| `sellToken` | string | Yes | Address of token to sell |
| `buyToken` | string | Yes | Address of token to buy |
| `sellAmount` | string | Yes | Amount to sell in wei (string) |
| `taker` | string | Yes | Taker wallet address |

**Response:**

```json
{
  "success": true,
  "data": {
    "chainId": 56,
    "sellToken": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    "buyToken": "0x55d398326f99059fF775485246999027B3197955",
    "sellAmount": "1000000000000000000",
    "buyAmount": "312500000000000000000",
    "price": "312.5",
    "expiry": 1735689600,
    "validUntil": "2024-01-01T12:00:00Z"
  }
}
```

---

#### Get Firm Quote

Get a binding firm quote that can be executed on-chain.

```http
POST /v1/quote/firm
```

**Request Body:**

```json
{
  "chainId": 56,
  "sellToken": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  "buyToken": "0x55d398326f99059fF775485246999027B3197955",
  "sellAmount": "1000000000000000000",
  "taker": "0xYourWalletAddress",
  "slippage": 0.5
}
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `chainId` | integer | Yes | Blockchain chain ID |
| `sellToken` | string | Yes | Address of token to sell |
| `buyToken` | string | Yes | Address of token to buy |
| `sellAmount` | string | Yes | Amount to sell in wei |
| `taker` | string | Yes | Taker wallet address |
| `slippage` | number | No | Acceptable slippage % (default: 0.5) |

**Response:**

```json
{
  "success": true,
  "data": {
    "quoteId": "0x1234...abcd",
    "chainId": 56,
    "sellToken": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    "buyToken": "0x55d398326f99059fF775485246999027B3197955",
    "sellAmount": "1000000000000000000",
    "buyAmount": "311875000000000000000",
    "minBuyAmount": "310315625000000000000",
    "expiry": 1735689600,
    "signature": "0x...",
    "calldata": {
      "to": "0xaAeD8af417B4bF80802fD1B0ccd44d8E15ba33Ff",
      "data": "0x...",
      "value": "0"
    }
  }
}
```

---

## WebSocket API

The WebSocket API is used by market makers to provide quotes.

### Connection

```javascript
const ws = new WebSocket('wss://mmhub.deluthium.ai/ws');

// Authenticate on connection
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};
```

### Message Types

#### Authentication

```json
{
  "type": "auth",
  "token": "your-jwt-token"
}
```

**Response:**

```json
{
  "type": "auth_response",
  "success": true,
  "makerId": "mm-001"
}
```

---

#### Subscribe to Pairs

```json
{
  "type": "subscribe",
  "pairs": [
    {
      "chainId": 56,
      "baseToken": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      "quoteToken": "0x55d398326f99059fF775485246999027B3197955"
    }
  ]
}
```

---

#### Push Depth Update

Market makers push their current bid/ask depth:

```json
{
  "type": "depth_update",
  "chainId": 56,
  "baseToken": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  "quoteToken": "0x55d398326f99059fF775485246999027B3197955",
  "bids": [
    { "price": "310.00", "size": "100" },
    { "price": "309.50", "size": "500" }
  ],
  "asks": [
    { "price": "311.00", "size": "100" },
    { "price": "311.50", "size": "500" }
  ],
  "timestamp": 1735689600000
}
```

---

#### Quote Request (Received)

When a taker requests a quote, MMs receive:

```json
{
  "type": "quote_request",
  "requestId": "req-12345",
  "chainId": 56,
  "sellToken": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  "buyToken": "0x55d398326f99059fF775485246999027B3197955",
  "sellAmount": "1000000000000000000",
  "taker": "0xTakerAddress",
  "deadline": 1735689610000
}
```

---

#### Quote Response (Send)

MMs respond with their quote:

```json
{
  "type": "quote_response",
  "requestId": "req-12345",
  "buyAmount": "312000000000000000000",
  "expiry": 1735689620,
  "signature": "0x..."
}
```

---

#### Heartbeat

Send periodic heartbeats to maintain connection:

```json
{
  "type": "heartbeat",
  "timestamp": 1735689600000
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing JWT |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Endpoint or resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "The sell token address is not supported on this chain",
    "details": {
      "sellToken": "0xinvalid...",
      "chainId": 56
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_TOKEN` | Token address not supported |
| `INVALID_AMOUNT` | Amount outside acceptable range |
| `INSUFFICIENT_LIQUIDITY` | No MM can fill this order |
| `QUOTE_EXPIRED` | Quote has expired |
| `INVALID_SIGNATURE` | Signature verification failed |
| `RATE_LIMITED` | Too many requests |

---

## Rate Limits

| Endpoint Type | Rate Limit | Window |
|---------------|------------|--------|
| Indicative Quote | 60 req/min | Per IP |
| Firm Quote | 30 req/min | Per IP |
| Token Listing | 10 req/min | Per IP |
| WebSocket Messages | 100 msg/min | Per Connection |

When rate limited, you'll receive a `429` response with headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735689660
Retry-After: 45
```

---

## Data Types

### Token Object

```typescript
interface Token {
  address: string;      // Hex address (0x...)
  symbol: string;       // Token symbol (e.g., "WBNB")
  name: string;         // Full name
  decimals: number;     // Token decimals (usually 18)
  chainId: number;      // Chain ID
}
```

### Quote Object

```typescript
interface Quote {
  quoteId: string;      // Unique quote identifier
  chainId: number;      // Chain ID
  sellToken: string;    // Token being sold
  buyToken: string;     // Token being bought
  sellAmount: string;   // Amount in wei (string)
  buyAmount: string;    // Expected output in wei
  minBuyAmount: string; // Minimum after slippage
  expiry: number;       // Unix timestamp
  signature: string;    // EIP-712 signature
}
```

### Calldata Object

```typescript
interface Calldata {
  to: string;           // Contract address
  data: string;         // Encoded calldata
  value: string;        // ETH/BNB value in wei
}
```

---

## Chain IDs Reference

| Chain | Chain ID | Status |
|-------|----------|--------|
| Ethereum Mainnet | 1 | Coming Soon |
| BSC Mainnet | 56 | Active |
| Polygon | 137 | Coming Soon |
| Arbitrum One | 42161 | Coming Soon |
| Optimism | 10 | Coming Soon |
| Avalanche C-Chain | 43114 | Coming Soon |
| Base | 8453 | Active |

---

## SDK References

For language-specific implementations, see:

- [CCXT Integration](adapters/CCXT.md) - Python, TypeScript, PHP
- [0x Protocol Adapter](adapters/ZEROX.md) - TypeScript
- [1inch Adapter](adapters/ONEINCH.md) - TypeScript

---

## Support

For API issues or integration support:

- **Website**: [https://deluthium.ai](https://deluthium.ai)
- **Documentation**: [https://docs.deluthium.ai](https://docs.deluthium.ai)

---

*Last updated: February 2026*
