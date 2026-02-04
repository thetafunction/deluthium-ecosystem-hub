# Hummingbot Deluthium Connector Guide

Use Hummingbot for algorithmic trading strategies on Deluthium DEX.

## Overview

Hummingbot supports **two modes** for Deluthium integration:

| Mode | Role | Connection | Use Case |
|------|------|------------|----------|
| **Taker Mode** | Quote Consumer | REST API | Execute trades, arbitrage |
| **Market Maker Mode** | Quote Provider | WebSocket Hub | Provide liquidity, earn rebates |

### Feature Comparison

| Feature | Taker Mode | Market Maker Mode |
|---------|------------|-------------------|
| Get quotes | ✅ | ❌ |
| Execute swaps | ✅ | ❌ |
| Push order book depth | ❌ | ✅ |
| Respond to RFQ | ❌ | ✅ |
| Earn MM rebates | ❌ | ✅ |
| Docker Image | `deluthium/hummingbot:latest` | `deluthium/hummingbot-mm:latest` |

---

# Part 1: Taker Mode (Quote Consumer)

The Deluthium REST connector for Hummingbot enables:
- Automated trading strategies
- Arbitrage opportunities
- Custom trading algorithms
- RFQ-based order execution

## Installation

### Docker (Recommended)

```bash
docker pull deluthium/hummingbot:latest

docker run -it \
  -v ./conf:/conf \
  -v ./logs:/logs \
  -e DELUTHIUM_JWT="your-token" \
  -e DELUTHIUM_CHAIN_ID=56 \
  -e DELUTHIUM_WALLET_ADDRESS="0xYourWallet" \
  deluthium/hummingbot
```

### From Source

```bash
git clone https://github.com/hummingbot/hummingbot.git
cd hummingbot
./install
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DELUTHIUM_JWT` | Yes | - | Your JWT token |
| `DELUTHIUM_CHAIN_ID` | No | 56 | Chain ID (56=BSC, 8453=Base) |
| `DELUTHIUM_WALLET_ADDRESS` | Yes | - | Your wallet address |

### Connector Configuration

Create `conf/connectors/deluthium.yml`:

```yaml
deluthium_api_key: ${DELUTHIUM_JWT}
deluthium_chain_id: 56
deluthium_wallet_address: ${DELUTHIUM_WALLET_ADDRESS}
deluthium_slippage: 0.5
```

## Usage

### Start Hummingbot

```bash
# With Docker Compose
docker-compose up -d hummingbot
docker-compose exec -it hummingbot bash

# Or directly
./bin/hummingbot.py
```

### Connect to Deluthium

```
>>> connect deluthium
```

### Check Status

```
>>> status
>>> balance
>>> markets
```

### Create a Strategy

Example: Pure market making

```
>>> create
What is your market making strategy?
>>> pure_market_making

Enter the trading pair:
>>> WBNB-USDT

Enter bid spread:
>>> 0.5

Enter ask spread:
>>> 0.5
```

## Trading Model

Deluthium uses an **RFQ (Request for Quote)** model:

1. **Market orders only** - No limit orders
2. **Indicative quotes** - For display/estimation
3. **Firm quotes** - Binding quotes with calldata
4. **No order cancellation** - Quotes expire automatically
5. **Calldata execution** - Hummingbot returns calldata, user broadcasts

## Limitations

| Feature | Supported | Notes |
|---------|-----------|-------|
| Market Orders | Yes | RFQ-based |
| Limit Orders | No | Not supported by RFQ model |
| Order Cancellation | No | Quotes expire automatically |
| Balance Query | Limited | DEX - requires wallet integration |
| Order Book | Synthetic | Aggregated from MM depth |

## Example Scripts

### Simple Quote Bot

```python
# scripts/deluthium_quote.py
from hummingbot.connector.exchange.deluthium import DeluthiumExchange

async def main():
    exchange = DeluthiumExchange(
        api_key=os.environ['DELUTHIUM_JWT'],
        chain_id=56,
    )
    
    # Get indicative quote
    quote = await exchange.get_quote(
        trading_pair="WBNB-USDT",
        is_buy=True,
        amount=Decimal("1.0")
    )
    
    print(f"Expected output: {quote.expected_output}")
    print(f"Price: {quote.price}")
```

### Market Making Strategy

```python
# scripts/deluthium_mm.py
from hummingbot.strategy.pure_market_making import PureMarketMakingStrategy

config = {
    "exchange": "deluthium",
    "trading_pair": "WBNB-USDT",
    "bid_spread": Decimal("0.5"),
    "ask_spread": Decimal("0.5"),
    "order_amount": Decimal("0.1"),
}

strategy = PureMarketMakingStrategy(**config)
```

## Supported Chains

| Chain | ID | Status |
|-------|-----|--------|
| BSC Mainnet | 56 | Ready |
| Base Mainnet | 8453 | Ready |
| Ethereum | 1 | Coming Soon |

## Troubleshooting

### Authentication Error

```
AuthenticationError: Token format invalid
```

Check your JWT token:
```bash
echo $DELUTHIUM_JWT
```

### Connection Issues

```
ConnectionError: Failed to connect
```

Verify API endpoint:
```bash
curl -H "Authorization: Bearer $DELUTHIUM_JWT" \
  https://rfq-api.deluthium.ai/v1/listing/pairs
```

### Insufficient Balance

Ensure your wallet has sufficient tokens and gas on the target chain.

## API Reference

### Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/v1/listing/pairs` | Get trading pairs |
| `/v1/listing/tokens` | Get supported tokens |
| `/v1/quote/indicative` | Get estimated price |
| `/v1/quote/firm` | Get binding quote |

### Base URL

```
https://rfq-api.deluthium.ai
```

---

# Part 2: Market Maker Mode (Quote Provider)

Use Hummingbot as a **Market Maker** on Deluthium DEX. This mode connects to the WebSocket hub, pushes order book depth, and responds to quote requests.

## Prerequisites

1. **Signer Account**: Create an Ethereum-compatible account for signing quotes
2. **JWT Token**: Obtain from Deluthium team with your signer address
3. **MMVault Contract**: Deploy and fund a vault contract (see [MM Guide](../MM_GUIDE.md))

## Installation

### Docker (Recommended)

```bash
docker pull deluthium/hummingbot-mm:latest

docker run -it \
  -v ./conf:/conf \
  -v ./logs:/logs \
  -e DELUTHIUM_JWT="your-token" \
  -e DELUTHIUM_CHAIN_ID=56 \
  -e MM_SIGNER_KEY="your-signer-private-key" \
  -e MM_VAULT_ADDRESS="0xYourVault" \
  deluthium/hummingbot-mm
```

### Docker Compose

```yaml
services:
  hummingbot-mm:
    image: deluthium/hummingbot-mm:latest
    environment:
      - DELUTHIUM_JWT=${DELUTHIUM_JWT}
      - DELUTHIUM_CHAIN_ID=${DELUTHIUM_CHAIN_ID:-56}
      - MM_SIGNER_KEY=${MM_SIGNER_KEY}
      - MM_VAULT_ADDRESS=${MM_VAULT_ADDRESS}
      - WS_URL=${WS_URL:-wss://mmhub.deluthium.ai/ws}
    volumes:
      - ./conf:/conf
      - ./logs:/logs
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DELUTHIUM_JWT` | Yes | - | Your JWT token |
| `DELUTHIUM_CHAIN_ID` | No | 56 | Chain ID (56=BSC, 8453=Base) |
| `MM_SIGNER_KEY` | Yes | - | Private key for signing quotes |
| `MM_VAULT_ADDRESS` | Yes | - | Your MMVault contract address |
| `WS_URL` | No | `wss://mmhub.deluthium.ai/ws` | WebSocket hub URL |
| `SPREAD_BPS` | No | 50 | Default spread in basis points |
| `MIN_ORDER_SIZE` | No | 0.01 | Minimum order size |

### Strategy Configuration

Create `conf/strategies/deluthium_mm.yml`:

```yaml
strategy: deluthium_market_making
version: 1

# Connection
chain_id: 56
ws_url: wss://mmhub.deluthium.ai/ws

# Trading pairs to market make
pairs:
  - base: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"  # WBNB
    quote: "0x55d398326f99059fF775485246999027B3197955" # USDT
    bid_spread_bps: 30
    ask_spread_bps: 30
    order_amount: "10"  # WBNB
    
  - base: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"  # ETH
    quote: "0x55d398326f99059fF775485246999027B3197955" # USDT
    bid_spread_bps: 40
    ask_spread_bps: 40
    order_amount: "0.5"  # ETH

# Risk management
max_position_size: "100"
quote_timeout_ms: 3000
enable_auto_rebalance: true

# Price source
price_source: binance  # or: coingecko, chainlink, custom
price_feed_url: ""     # For custom price source
```

## Usage

### Start Market Maker

```bash
# With Docker Compose
docker-compose up -d hummingbot-mm
docker-compose logs -f hummingbot-mm

# Or use the CLI
./bin/hummingbot_mm.py --config conf/strategies/deluthium_mm.yml
```

### Commands

```
>>> status           # Show MM status and metrics
>>> pairs            # List active trading pairs  
>>> depth            # Show current depth being pushed
>>> quotes           # Show recent quote requests/responses
>>> stop             # Stop market making
>>> start            # Resume market making
```

## How It Works

### 1. Connection Flow

```
┌─────────────┐     ┌──────────────────┐
│ Hummingbot  │────>│ mmhub.deluthium  │
│     MM      │     │   /ws            │
└─────────────┘     └──────────────────┘
      │                     │
      │ 1. Connect + JWT    │
      │────────────────────>│
      │                     │
      │ 2. ConnectionAck    │
      │<────────────────────│
      │                     │
      │ 3. DepthSnapshot    │
      │────────────────────>│  (every 1s)
      │                     │
      │ 4. QuoteRequest     │
      │<────────────────────│  (when user swaps)
      │                     │
      │ 5. QuoteResponse    │
      │────────────────────>│  (signed quote)
      │                     │
```

### 2. Depth Push

Hummingbot automatically constructs and pushes order book depth based on your configuration:

```python
# Internal depth calculation
bid_price = mid_price * (1 - bid_spread_bps / 10000)
ask_price = mid_price * (1 + ask_spread_bps / 10000)

depth = {
    "bids": [{"price": bid_price, "amount": order_amount}],
    "asks": [{"price": ask_price, "amount": order_amount}]
}
```

### 3. Quote Response

When a user requests a swap, Hummingbot:

1. Receives `QuoteRequest` with amount and tokens
2. Calculates output amount based on your spread
3. Signs the quote with EIP-712 signature
4. Sends `QuoteResponse` back to the hub

## Advanced Configuration

### Multi-Level Order Book

```yaml
# Create multiple levels of depth
pairs:
  - base: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    quote: "0x55d398326f99059fF775485246999027B3197955"
    levels:
      - spread_bps: 20
        amount: "5"
      - spread_bps: 40
        amount: "20"
      - spread_bps: 60
        amount: "50"
```

### Custom Price Feed

```yaml
price_source: custom
price_feed_url: "http://your-price-api.com/prices"
price_feed_format: "json"
price_feed_path: "$.data.{pair}.mid_price"
```

### AWS KMS Signing (Production)

```yaml
# Use AWS KMS instead of raw private key
signer:
  type: aws_kms
  region: us-east-1
  key_id: "alias/deluthium-mm-signer"
```

## Monitoring

### Metrics Exported

| Metric | Description |
|--------|-------------|
| `mm_quotes_received` | Total quote requests received |
| `mm_quotes_responded` | Successful quote responses |
| `mm_quotes_rejected` | Rejected quotes |
| `mm_response_latency_ms` | Quote response time |
| `mm_connection_uptime` | WebSocket connection uptime |
| `mm_depth_pushes` | Depth snapshots pushed |

### Prometheus Integration

```yaml
# Enable metrics endpoint
metrics:
  enabled: true
  port: 9090
  path: /metrics
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Hub unavailable | Check WS_URL and network |
| `Authentication failed` | Invalid JWT | Verify DELUTHIUM_JWT |
| `Signature invalid` | Wrong signer | Check MM_SIGNER_KEY matches registered address |
| `Quote timeout` | Response too slow | Optimize pricing logic |

### Reconnection

Hummingbot automatically reconnects with exponential backoff:

```
1st retry: 1s
2nd retry: 2s
3rd retry: 4s
...
Max: 60s
```

## Best Practices

1. **Use KMS/HSM** for production signing - never raw private keys
2. **Monitor quote acceptance rate** - adjust spreads if too low
3. **Set appropriate position limits** - prevent overexposure
4. **Use multiple price sources** - avoid stale prices
5. **Log everything** - for debugging and compliance

## Support

- Hummingbot Docs: [docs.hummingbot.org](https://docs.hummingbot.org)
- Deluthium: [deluthium.ai](https://deluthium.ai)
- MM Guide: [Market Maker Guide](../MM_GUIDE.md)
