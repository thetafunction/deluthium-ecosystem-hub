# 0x Protocol to Deluthium Adapter Guide

Translate 0x Protocol v4 RFQ orders to Deluthium format for existing 0x market makers.

## Overview

This adapter enables 0x Protocol v4 market makers to integrate with Deluthium by:
- Converting 0x RFQ order structures to DarkPool MMQuote format
- Handling EIP-712 signature transformations
- Supporting native token wrapping/unwrapping
- Providing a proxy for API requests

## Installation

### NPM

```bash
npm install @deluthium/0x-adapter
```

### Docker

```bash
docker pull deluthium/0x-adapter:latest
docker run -p 3001:3000 \
  -e DELUTHIUM_JWT="your-token" \
  -e CHAIN_ID=56 \
  deluthium/0x-adapter
```

### From Source

```bash
git clone https://github.com/thetafunction/0x-deluthium-adapter.git
cd 0x-deluthium-adapter
npm install
npm run build
```

## Field Mapping

| 0x v4 Field | Deluthium Field | Description |
|-------------|-----------------|-------------|
| `makerToken` | `outputToken` | Token MM provides |
| `takerToken` | `inputToken` | Token user pays |
| `makerAmount` | `amountOut` | Output quantity (wei) |
| `takerAmount` | `amountIn` | Input quantity (wei) |
| `maker` | `signer` | MM's signing address |
| `taker` | `to` | User's receiving address |
| `txOrigin` | `from` | User's sending address |
| `expiry` | `deadline` | Unix timestamp |
| `salt` | `nonce` | Anti-replay value |
| N/A | `manager` | RFQ Manager contract (new) |

## Usage

### Transform a 0x Order

```typescript
import { transform0xToDarkPool } from '@deluthium/0x-adapter';

const zeroExOrder = {
  makerToken: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
  takerToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
  makerAmount: '1000000000000000000000', // 1000 USDC
  takerAmount: '4000000000000000000',    // 4 WBNB
  maker: '0xYourMakerAddress',
  taker: '0xTakerAddress',
  txOrigin: '0xTakerAddress',
  expiry: Math.floor(Date.now() / 1000) + 300,
  salt: '12345',
  pool: '0x0000000000000000000000000000000000000000',
};

const darkPoolQuote = transform0xToDarkPool(zeroExOrder, 56);

console.log(darkPoolQuote);
// {
//   manager: '0x94020Af3571f253754e5566710A89666d90Df615',
//   from: '0xTakerAddress',
//   to: '0xTakerAddress',
//   inputToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
//   outputToken: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
//   amountIn: '4000000000000000000',
//   amountOut: '1000000000000000000000',
//   deadline: ...,
//   nonce: '12345',
//   extraData: '0x',
// }
```

### Sign a DarkPool Quote

```typescript
import { signDarkPoolQuote } from '@deluthium/0x-adapter';

const signature = await signDarkPoolQuote(
  darkPoolQuote,
  privateKey,  // Your signer private key
  56           // Chain ID
);

console.log(signature);
// 0x... (65 bytes)
```

### Use the Proxy

```typescript
import { ZeroExToDarkPoolProxy } from '@deluthium/0x-adapter';

const proxy = new ZeroExToDarkPoolProxy({
  jwtToken: process.env.DELUTHIUM_JWT,
  chainId: 56,
  privateKey: process.env.SIGNER_KEY, // Or use signer interface
});

// Transform and submit a 0x order
const result = await proxy.transformAndSubmit(zeroExOrder);

console.log(result);
// {
//   quote_id: '...',
//   calldata: '0x...',
//   router_address: '...',
//   amount_out: '...',
// }
```

## EIP-712 Domain

The adapter uses Deluthium's EIP-712 domain:

```typescript
const domain = {
  name: "DarkPool Pool",  // Note the space
  version: "1",
  chainId: chainId,
  verifyingContract: rfqManagerAddress,
};
```

## Native Token Handling

The adapter handles native tokens (ETH/BNB) automatically:

```typescript
// 0x uses zero address for native tokens
const zeroAddress = '0x0000000000000000000000000000000000000000';

// Adapter converts to wrapped token for internal pricing
// but preserves zero address in API calls
```

## Chain Configuration

| Chain | RFQ Manager |
|-------|-------------|
| BSC (56) | `0x94020Af3571f253754e5566710A89666d90Df615` |
| Base (8453) | `0x7648CE928efa92372E2bb34086421a8a1702bD36` |
| Ethereum (1) | TBD |

## API Client

The adapter includes a REST API client:

```typescript
import { DarkPoolAPIClient } from '@deluthium/0x-adapter';

const client = new DarkPoolAPIClient({
  jwtToken: process.env.DELUTHIUM_JWT,
  baseUrl: 'https://rfq-api.deluthium.ai',
});

// Get indicative quote
const quote = await client.getIndicativeQuote({
  src_chain_id: 56,
  dst_chain_id: 56,
  token_in: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  token_out: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  amount_in: '1000000000000000000',
});

// Get firm quote with calldata
const firmQuote = await client.getFirmQuote({
  src_chain_id: 56,
  dst_chain_id: 56,
  from_address: '0xYourAddress',
  to_address: '0xYourAddress',
  token_in: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  token_out: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  amount_in: '1000000000000000000',
  slippage: 0.5,
  expiry_time_sec: 60,
});
```

## Error Handling

```typescript
import { ValidationError, UnsupportedChainError, APIError } from '@deluthium/0x-adapter';

try {
  const result = await proxy.transformAndSubmit(order);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed: ${error.field} - ${error.message}`);
  } else if (error instanceof UnsupportedChainError) {
    console.error(`Chain ${error.chainId} is not supported`);
  } else if (error instanceof APIError) {
    console.error(`API error: ${error.httpStatus} - ${error.message}`);
  }
}
```

## Security Considerations

1. **Never expose private keys** - Use environment variables or KMS
2. **Validate all inputs** - The adapter includes validation helpers
3. **Use secure signing** - Consider KMS/HSM for production

## Docker Usage

```bash
docker run -d \
  --name 0x-adapter \
  -p 3001:3000 \
  -e DELUTHIUM_JWT="your-token" \
  -e CHAIN_ID=56 \
  deluthium/0x-adapter

# Test
curl http://localhost:3001/health
```

## Support

- GitHub: [thetafunction/0x-deluthium-adapter](https://github.com/thetafunction/0x-deluthium-adapter)
- Deluthium: [deluthium.ai](https://deluthium.ai)
