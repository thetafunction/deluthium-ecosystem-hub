# Hummingbot Deluthium Connector Guide

Use Hummingbot for algorithmic trading strategies on Deluthium DEX.

## Overview

The Deluthium connector for Hummingbot enables:
- Automated market making
- Arbitrage strategies
- Custom trading algorithms
- RFQ-based trading

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

## Support

- Hummingbot Docs: [docs.hummingbot.org](https://docs.hummingbot.org)
- Deluthium: [deluthium.ai](https://deluthium.ai)
