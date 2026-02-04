# 1inch Limit Order V4 to Deluthium Adapter Guide

Production-ready adapter for integrating Deluthium with 1inch Limit Order Protocol V4.

## Overview

This adapter provides:
- Conversion between Deluthium MMQuote and 1inch LimitOrderV4
- MakerTraits bit-packed encoding
- Secure signer abstraction (KMS/HSM support)
- Nonce management with epoch support
- Comprehensive validation layer
- DeluthiumOracle for 1inch spot-price-aggregator

## Installation

### NPM

```bash
npm install @deluthium/1inch-adapter
```

### Docker

```bash
docker pull deluthium/1inch-adapter:latest
docker run -p 3002:3000 \
  -e DELUTHIUM_JWT="your-token" \
  -e CHAIN_ID=56 \
  deluthium/1inch-adapter
```

## Field Mapping

| Deluthium Field | 1inch Field | Description |
|-----------------|-------------|-------------|
| `outputToken` | `makerAsset` | Token MM provides |
| `inputToken` | `takerAsset` | Token user pays |
| `amountOut` | `makingAmount` | Output quantity |
| `amountIn` | `takingAmount` | Input quantity |
| `signer` | `maker` | MM's address |
| `to` | `receiver` | Recipient address |
| `nonce` | `salt` | Order unique ID |

## Usage

### Basic Transformation

```typescript
import { DeluthiumAdapter } from '@deluthium/1inch-adapter';
import { Wallet } from 'ethers';

const signer = new Wallet(process.env.PRIVATE_KEY);

const adapter = new DeluthiumAdapter({
  chainId: 56,
  signer: signer,
});

// Convert Deluthium quote to 1inch LimitOrderV4
const deluthiumQuote = {
  manager: '0x94020Af3571f253754e5566710A89666d90Df615',
  from: '0xUserAddress',
  to: '0xUserAddress',
  inputToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  outputToken: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  amountIn: BigInt('1000000000000000000'),
  amountOut: BigInt('250000000000000000000'),
  deadline: Math.floor(Date.now() / 1000) + 300,
  nonce: BigInt('12345'),
  extraData: '0x',
};

const limitOrder = await adapter.toLimitOrderV4(deluthiumQuote);

console.log(limitOrder);
// {
//   maker: '0xMMVaultAddress',
//   receiver: '0xUserAddress',
//   makerAsset: '0x8AC76...',
//   takerAsset: '0xbb4CdB...',
//   makingAmount: '250000000000000000000',
//   takingAmount: '1000000000000000000',
//   salt: '12345',
//   makerTraits: '...',
// }
```

### RFQ Order (Lightweight)

```typescript
// For RFQ-specific use cases
const rfqOrder = await adapter.toRfqOrder(deluthiumQuote);

console.log(rfqOrder);
// {
//   maker: '...',
//   makerAsset: '...',
//   takerAsset: '...',
//   makingAmount: '...',
//   takingAmount: '...',
//   allowedSender: '...',
// }
```

## MakerTraits Encoding

The adapter handles 1inch V4's bit-packed `makerTraits` field:

```typescript
import { MakerTraits } from '@deluthium/1inch-adapter';

const traits = new MakerTraits();

// Set expiration (bits 0-39)
traits.setExpiration(Math.floor(Date.now() / 1000) + 300);

// Set nonce epoch (bits 40-79)
traits.setEpoch(1);

// Set nonce value (bits 80-119)
traits.setNonce(12345);

// Allow partial fills (bit 255)
traits.setAllowPartialFills(true);

const encoded = traits.encode();
// BigInt representation of all flags
```

### Traits Bit Layout

| Bits | Field | Description |
|------|-------|-------------|
| 0-39 | expiration | Unix timestamp |
| 40-79 | nonceOrEpoch | Epoch for series |
| 80-119 | series | Nonce within epoch |
| 254 | allowMultipleFills | Allow partial |
| 255 | noPartialFills | Require full fill |

## Signer Abstraction

**Never use raw private keys in production.** Use the ISigner interface:

```typescript
interface ISigner {
  getAddress(): Promise<string>;
  signTypedData(domain, types, value): Promise<string>;
}
```

### AWS KMS Example

```typescript
import { KmsSigner } from '@deluthium/1inch-adapter';

const signer = new KmsSigner({
  keyId: 'alias/my-signing-key',
  region: 'us-east-1',
});

const adapter = new DeluthiumAdapter({
  chainId: 56,
  signer: signer,
});
```

### HashiCorp Vault Example

```typescript
import { VaultSigner } from '@deluthium/1inch-adapter';

const signer = new VaultSigner({
  url: 'https://vault.example.com',
  token: process.env.VAULT_TOKEN,
  keyPath: 'transit/keys/mm-signer',
});
```

## Nonce Management

Prevent replay attacks with the NonceManager:

```typescript
import { NonceManager } from '@deluthium/1inch-adapter';

const nonceManager = new NonceManager({
  epoch: 1,
  startingNonce: 0,
});

// Get next nonce
const nonce = nonceManager.next();

// Check if nonce is valid
const isValid = nonceManager.isValid(nonce);

// Invalidate nonce after use
nonceManager.use(nonce);
```

## Validation Layer

Validate quotes before processing:

```typescript
import { validateQuote } from '@deluthium/1inch-adapter';

const result = validateQuote({
  quoteId: 'abc123',
  inputToken: '0x...',
  outputToken: '0x...',
  amountIn: '1000000000000000000',
  amountOut: '250000000000000000000',
  deadline: Math.floor(Date.now() / 1000) + 300,
  nonce: '12345',
});

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## DeluthiumOracle (1inch Integration)

For 1inch spot-price-aggregator integration:

### Smart Contract

```solidity
// Deploy DeluthiumOracle.sol
contract DeluthiumOracle is IOracle, Ownable {
    function getRate(
        IERC20 srcToken,
        IERC20 dstToken,
        IERC20 connector,
        uint256 thresholdFilter
    ) external view returns (uint256 rate, uint256 weight);
    
    function updatePrice(
        address srcToken,
        address dstToken,
        uint256 rate
    ) external onlyPriceUpdater;
}
```

### Price Updater Service

```typescript
import { PriceUpdater } from '@deluthium/1inch-adapter';

const updater = new PriceUpdater({
  deluthiumJwt: process.env.DELUTHIUM_JWT,
  oracleAddress: '0xOracleAddress',
  rpcUrl: 'https://bsc-dataseed.binance.org/',
  privateKey: process.env.UPDATER_KEY,
});

// Update prices periodically
await updater.start({
  intervalMs: 60000, // Every minute
  pairs: ['WBNB-USDT', 'WBNB-USDC'],
});
```

## Error Handling

```typescript
import {
  ValidationError,
  UnsupportedChainError,
  SigningError,
  APIError,
} from '@deluthium/1inch-adapter';

try {
  const order = await adapter.toLimitOrderV4(quote);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Invalid ${error.field}: ${error.message}`);
  } else if (error instanceof SigningError) {
    console.error(`Signing failed: ${error.message}`);
  }
}
```

## Supported Chains

| Chain | ID | RFQ Manager | Status |
|-------|-----|-------------|--------|
| BSC | 56 | `0x94020Af...` | Ready |
| Base | 8453 | `0x7648CE...` | Ready |
| Ethereum | 1 | TBD | Planned |

## Docker Compose

```yaml
services:
  1inch-adapter:
    image: deluthium/1inch-adapter:latest
    ports:
      - "3002:3000"
    environment:
      - DELUTHIUM_JWT=${DELUTHIUM_JWT}
      - CHAIN_ID=56
      - AWS_REGION=us-east-1
      - AWS_KMS_KEY_ID=${KMS_KEY_ID}
```

## Best Practices

1. **Use KMS/HSM** for production signing
2. **Validate all inputs** before processing
3. **Implement retry logic** with exponential backoff
4. **Monitor nonce usage** to prevent gaps
5. **Set reasonable expiration** (60-300 seconds)

## Support

- GitHub: [thetafunction/1inch-deluthium-adapter](https://github.com/thetafunction/1inch-deluthium-adapter)
- 1inch Docs: [docs.1inch.io](https://docs.1inch.io)
- Deluthium: [deluthium.ai](https://deluthium.ai)
