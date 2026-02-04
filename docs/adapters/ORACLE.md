# Deluthium Price Oracle Guide

Integrate Deluthium prices with 1inch spot-price-aggregator.

## Overview

The DeluthiumOracle provides on-chain price data for 1inch aggregator by:
- Fetching prices from Deluthium RFQ API
- Pushing prices on-chain via trusted updater
- Implementing the 1inch IOracle interface
- Supporting weight-based price filtering

## Architecture

```
Deluthium RFQ API
       │
       ▼
┌─────────────────┐
│  Price Updater  │ (Off-chain service)
│    Service      │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ DeluthiumOracle │ (On-chain contract)
│    Contract     │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ 1inch Spot      │
│ Price Aggregator│
└─────────────────┘
```

## Smart Contract

### DeluthiumOracle.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@1inch/spot-price-aggregator/contracts/interfaces/IOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DeluthiumOracle is IOracle, Ownable {
    uint256 public constant MAX_PRICE_AGE = 5 minutes;
    
    address public priceUpdater;
    
    struct PriceData {
        uint256 rate;
        uint256 timestamp;
    }
    
    // srcToken => dstToken => PriceData
    mapping(address => mapping(address => PriceData)) public prices;
    
    event PriceUpdated(
        address indexed srcToken,
        address indexed dstToken,
        uint256 rate,
        uint256 timestamp
    );
    
    modifier onlyPriceUpdater() {
        require(msg.sender == priceUpdater, "Not price updater");
        _;
    }
    
    constructor(address _priceUpdater) Ownable(msg.sender) {
        priceUpdater = _priceUpdater;
    }
    
    function setPriceUpdater(address _priceUpdater) external onlyOwner {
        priceUpdater = _priceUpdater;
    }
    
    function updatePrice(
        address srcToken,
        address dstToken,
        uint256 rate
    ) external onlyPriceUpdater {
        prices[srcToken][dstToken] = PriceData({
            rate: rate,
            timestamp: block.timestamp
        });
        
        emit PriceUpdated(srcToken, dstToken, rate, block.timestamp);
    }
    
    function batchUpdatePrices(
        address[] calldata srcTokens,
        address[] calldata dstTokens,
        uint256[] calldata rates
    ) external onlyPriceUpdater {
        require(
            srcTokens.length == dstTokens.length &&
            dstTokens.length == rates.length,
            "Length mismatch"
        );
        
        for (uint256 i = 0; i < srcTokens.length; i++) {
            prices[srcTokens[i]][dstTokens[i]] = PriceData({
                rate: rates[i],
                timestamp: block.timestamp
            });
            
            emit PriceUpdated(srcTokens[i], dstTokens[i], rates[i], block.timestamp);
        }
    }
    
    function getRate(
        IERC20 srcToken,
        IERC20 dstToken,
        IERC20 connector,
        uint256 thresholdFilter
    ) external view override returns (uint256 rate, uint256 weight) {
        // Direct rate lookup
        PriceData memory data = prices[address(srcToken)][address(dstToken)];
        
        // Check freshness
        if (data.timestamp == 0 || block.timestamp - data.timestamp > MAX_PRICE_AGE) {
            return (0, 0);
        }
        
        // Return rate with weight (higher weight = more trusted)
        return (data.rate, 1e18); // Full weight
    }
}
```

## Deployment

### Using Hardhat

```bash
cd contracts
npm install
npx hardhat compile
```

```javascript
// deploy/DeluthiumOracle.deploy.js
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    const priceUpdaterAddress = process.env.PRICE_UPDATER_ADDRESS;
    
    const DeluthiumOracle = await ethers.getContractFactory("DeluthiumOracle");
    const oracle = await DeluthiumOracle.deploy(priceUpdaterAddress);
    
    await oracle.deployed();
    
    console.log("DeluthiumOracle deployed to:", oracle.address);
}

main();
```

```bash
npx hardhat run deploy/DeluthiumOracle.deploy.js --network bsc
```

## Price Updater Service

### Configuration

```typescript
// price-updater/src/config.ts
export const config = {
  deluthiumJwt: process.env.DELUTHIUM_JWT,
  deluthiumApiUrl: 'https://rfq-api.deluthium.ai',
  oracleAddress: process.env.ORACLE_ADDRESS,
  rpcUrl: process.env.RPC_URL,
  privateKey: process.env.UPDATER_PRIVATE_KEY,
  updateIntervalMs: 60000, // 1 minute
  pairs: [
    { src: 'WBNB', dst: 'USDT' },
    { src: 'WBNB', dst: 'USDC' },
    { src: 'WETH', dst: 'USDT' },
  ],
};
```

### Service Implementation

```typescript
// price-updater/src/index.ts
import { ethers } from 'ethers';
import cron from 'node-cron';

const ORACLE_ABI = [
  'function batchUpdatePrices(address[] srcTokens, address[] dstTokens, uint256[] rates)',
];

class PriceUpdater {
  private oracle: ethers.Contract;
  private wallet: ethers.Wallet;
  private jwtToken: string;
  
  constructor(config: Config) {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, provider);
    this.oracle = new ethers.Contract(config.oracleAddress, ORACLE_ABI, this.wallet);
    this.jwtToken = config.deluthiumJwt;
  }
  
  async fetchPrices(pairs: Pair[]): Promise<PriceData[]> {
    const results: PriceData[] = [];
    
    for (const pair of pairs) {
      const response = await fetch(`${API_URL}/v1/quote/indicative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.jwtToken}`,
        },
        body: JSON.stringify({
          src_chain_id: 56,
          dst_chain_id: 56,
          token_in: pair.srcAddress,
          token_out: pair.dstAddress,
          amount_in: '1000000000000000000', // 1 token
        }),
      });
      
      const data = await response.json();
      
      if (data.code === 10000) {
        results.push({
          srcToken: pair.srcAddress,
          dstToken: pair.dstAddress,
          rate: BigInt(data.data.amount_out),
        });
      }
    }
    
    return results;
  }
  
  async updatePrices(prices: PriceData[]): Promise<void> {
    const srcTokens = prices.map(p => p.srcToken);
    const dstTokens = prices.map(p => p.dstToken);
    const rates = prices.map(p => p.rate);
    
    const tx = await this.oracle.batchUpdatePrices(srcTokens, dstTokens, rates);
    await tx.wait();
    
    console.log(`Updated ${prices.length} prices. TX: ${tx.hash}`);
  }
  
  async start(): Promise<void> {
    // Update immediately
    await this.runUpdate();
    
    // Schedule updates every minute
    cron.schedule('* * * * *', () => this.runUpdate());
    
    console.log('Price updater started');
  }
  
  private async runUpdate(): Promise<void> {
    try {
      const prices = await this.fetchPrices(config.pairs);
      await this.updatePrices(prices);
    } catch (error) {
      console.error('Update failed:', error);
    }
  }
}

// Start service
const updater = new PriceUpdater(config);
updater.start();
```

## Docker Deployment

```dockerfile
# price-updater/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
services:
  price-updater:
    build: ./price-updater
    environment:
      - DELUTHIUM_JWT=${DELUTHIUM_JWT}
      - ORACLE_ADDRESS=${ORACLE_ADDRESS}
      - RPC_URL=${RPC_URL}
      - UPDATER_PRIVATE_KEY=${UPDATER_PRIVATE_KEY}
    restart: unless-stopped
```

## Integration with 1inch Aggregator

Once deployed, register the oracle with 1inch:

```solidity
// 1inch MultiOracle registration
multiOracle.addOracle(deluthiumOracleAddress, uint8(OracleType.GENERIC));
```

## Security Considerations

1. **Price Updater Key**: Keep the updater private key secure (use KMS)
2. **Price Staleness**: Oracle rejects prices older than 5 minutes
3. **Access Control**: Only authorized updater can push prices
4. **Rate Validation**: Validate rates before pushing to contract

## Monitoring

Monitor the price updater service:

```typescript
// Add Prometheus metrics
const metrics = {
  pricesUpdated: new Counter('prices_updated_total'),
  updateLatency: new Histogram('update_latency_seconds'),
  updateErrors: new Counter('update_errors_total'),
};
```

## Gas Optimization

For batch updates, gas costs scale linearly:
- Single update: ~50,000 gas
- 10 pairs: ~200,000 gas
- 50 pairs: ~800,000 gas

## Support

- GitHub: [thetafunction/1inch-deluthium-adapter](https://github.com/thetafunction/1inch-deluthium-adapter)
- 1inch Docs: [docs.1inch.io](https://docs.1inch.io)
- Deluthium: [deluthium.ai](https://deluthium.ai)
