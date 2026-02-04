# Deluthium Quick Start Guide

Get up and running with Deluthium integrations in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- A Deluthium JWT token (contact the team at [deluthium.ai](https://deluthium.ai))

## Step 1: Clone the Repository

```bash
git clone https://github.com/thetafunction/deluthium-Ecosystem-Hub.git
cd deluthium-Ecosystem-Hub
```

## Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your JWT token
nano .env

# Or set directly
export DELUTHIUM_JWT="your-jwt-token-here"
```

## Step 3: Start Services

### Option A: All Services

```bash
docker-compose up -d
```

### Option B: Specific Services

```bash
# Just CCXT development environment
docker-compose up -d ccxt

# Hummingbot trading bot
docker-compose up -d hummingbot

# 0x and 1inch adapters
docker-compose up -d 0x-adapter 1inch-adapter
```

## Step 4: Verify

```bash
# Check running services
docker-compose ps

# View logs
docker-compose logs -f
```

## Using CCXT

### Python

```bash
# Enter the CCXT container
docker-compose exec ccxt bash

# Run Python
python3
```

```python
import os
import ccxt

exchange = ccxt.deluthium({
    'apiKey': os.environ['DELUTHIUM_JWT']
})

# Fetch markets
markets = exchange.fetch_markets()
print(f"Found {len(markets)} trading pairs")

# Get ticker
ticker = exchange.fetch_ticker('WBNB/USDT')
print(f"WBNB/USDT price: {ticker['last']}")
```

### JavaScript

```bash
# Enter the CCXT container
docker-compose exec ccxt bash

# Run Node
node
```

```javascript
const ccxt = require('ccxt');

const exchange = new ccxt.deluthium({
    apiKey: process.env.DELUTHIUM_JWT
});

(async () => {
    const markets = await exchange.loadMarkets();
    console.log(`Found ${Object.keys(markets).length} trading pairs`);
    
    const ticker = await exchange.fetchTicker('WBNB/USDT');
    console.log(`WBNB/USDT price: ${ticker.last}`);
})();
```

## Using Hummingbot

```bash
# Attach to Hummingbot
docker-compose exec -it hummingbot bash

# Inside Hummingbot, connect to Deluthium
>>> connect deluthium
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/quote/indicative` | POST | Get estimated price |
| `/v1/quote/firm` | POST | Get binding quote with calldata |
| `/v1/listing/pairs` | GET | Get trading pairs |
| `/v1/listing/tokens` | GET | Get supported tokens |

**Base URL**: `https://rfq-api.deluthium.ai`

## Supported Chains

| Chain | ID | Native Token |
|-------|-----|--------------|
| BSC | 56 | BNB |
| Base | 8453 | ETH |
| Ethereum | 1 | ETH |

## Troubleshooting

### JWT Token Issues

```
ERROR: DELUTHIUM_JWT is required!
```

Make sure your JWT token is set:
```bash
export DELUTHIUM_JWT="your-token"
# or in docker-compose, check .env file
```

### Connection Refused

```
connect ECONNREFUSED
```

Check that the Deluthium API is accessible:
```bash
curl -H "Authorization: Bearer $DELUTHIUM_JWT" \
  https://rfq-api.deluthium.ai/v1/listing/pairs
```

### Rate Limiting

If you see 429 errors, implement exponential backoff:
```python
import time

def with_retry(fn, max_retries=3):
    for i in range(max_retries):
        try:
            return fn()
        except Exception as e:
            if '429' in str(e) and i < max_retries - 1:
                time.sleep(2 ** i)
                continue
            raise
```

## Next Steps

- [CCXT Integration Guide](adapters/CCXT.md)
- [Hummingbot Connector Guide](adapters/HUMMINGBOT.md)
- [Market Maker Guide](MM_GUIDE.md)

## Support

For API access and support, contact the Deluthium team at [https://deluthium.ai](https://deluthium.ai).
