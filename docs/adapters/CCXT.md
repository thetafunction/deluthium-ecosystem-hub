# CCXT Deluthium Integration Guide

Use the unified CCXT library to interact with Deluthium DEX across Python, JavaScript, PHP, Go, and C#.

## Installation

### Python

```bash
pip install ccxt
```

### JavaScript/TypeScript

```bash
npm install ccxt
```

### PHP

```bash
composer require ccxt/ccxt
```

## Basic Configuration

### Python

```python
import ccxt

exchange = ccxt.deluthium({
    'apiKey': 'YOUR_JWT_TOKEN',  # Required for ALL API calls
    'options': {
        'defaultChainId': 56,    # BSC (default)
        'defaultSlippage': 0.5,  # 0.5%
    }
})
```

### JavaScript/TypeScript

```typescript
import ccxt from 'ccxt';

const exchange = new ccxt.deluthium({
    apiKey: 'YOUR_JWT_TOKEN',
    options: {
        defaultChainId: 56,
        defaultSlippage: 0.5,
    }
});
```

## Supported Features

| Feature | Method | Description |
|---------|--------|-------------|
| Markets | `fetchMarkets()` | Get all trading pairs |
| Currencies | `fetchCurrencies()` | Get supported tokens |
| Ticker | `fetchTicker(symbol)` | Get price/volume data |
| OHLCV | `fetchOHLCV(symbol, timeframe)` | Get candlestick data |
| Quote | `fetchQuote(symbol, amount, side)` | Get indicative quote |
| Order | `createOrder(symbol, type, side, amount)` | Get firm quote with calldata |

## Usage Examples

### Fetch Markets

```python
markets = exchange.fetch_markets()
for market in markets[:5]:
    print(f"{market['symbol']}: {market['base']}/{market['quote']}")
```

### Fetch Ticker

```python
# Load markets first
exchange.load_markets()

ticker = exchange.fetch_ticker('WBNB/USDT')
print(f"Price: {ticker['last']}")
print(f"24h Volume: {ticker['baseVolume']}")
print(f"24h High: {ticker['high']}")
print(f"24h Low: {ticker['low']}")
```

### Fetch OHLCV

```python
ohlcv = exchange.fetch_ohlcv('WBNB/USDT', '1h', limit=100)
for candle in ohlcv[-5:]:
    timestamp, open, high, low, close, volume = candle
    print(f"{timestamp}: O={open} H={high} L={low} C={close} V={volume}")
```

### Get Indicative Quote

```python
quote = exchange.fetch_quote('WBNB/USDT', 1.0, 'buy', {'chainId': 56})
print(f"Amount In: {quote['amount_in']}")
print(f"Amount Out: {quote['amount_out']}")
print(f"Fee: {quote['fee_amount']}")
```

### Create Order (Firm Quote)

```python
order = exchange.create_order(
    symbol='WBNB/USDT',
    type='market',        # Only market orders supported
    side='buy',
    amount=1.0,           # Amount in quote currency
    price=None,           # Not used for RFQ
    params={
        'walletAddress': '0xYourWalletAddress',
        'slippage': 0.5,
    }
)

# IMPORTANT: CCXT returns calldata, does NOT broadcast
print(f"Router: {order['info']['router_address']}")
print(f"Calldata: {order['info']['calldata']}")
```

### Broadcasting the Transaction

CCXT does NOT execute blockchain transactions. You must broadcast yourself:

```python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider('https://bsc-dataseed.binance.org/'))

tx = {
    'to': order['info']['router_address'],
    'data': order['info']['calldata'],
    'gas': 300000,
    'gasPrice': w3.eth.gas_price,
    'nonce': w3.eth.get_transaction_count(your_wallet),
    'chainId': 56,
}

signed = w3.eth.account.sign_transaction(tx, your_private_key)
tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
print(f"Transaction: {tx_hash.hex()}")
```

## Chain Configuration

### Switch Chains

```python
# BSC (default)
exchange.options['defaultChainId'] = 56

# Base
exchange.options['defaultChainId'] = 8453

# Ethereum
exchange.options['defaultChainId'] = 1
```

### Cross-Chain Swaps

```python
order = exchange.create_order('WBNB/USDT', 'market', 'buy', 1.0, None, {
    'chainId': 56,        # Source chain: BSC
    'dstChainId': 8453,   # Destination chain: Base
    'slippage': 1.0,      # Higher slippage for cross-chain
    'walletAddress': '0xYourWallet',
})
```

## Error Handling

```python
import ccxt

try:
    quote = exchange.fetch_quote('INVALID/PAIR', 1.0, 'buy')
except ccxt.BadSymbol as e:
    print(f"Invalid symbol: {e}")
except ccxt.InsufficientFunds as e:
    print(f"Insufficient liquidity: {e}")
except ccxt.AuthenticationError as e:
    print(f"JWT token error: {e}")
except ccxt.ExchangeError as e:
    print(f"Exchange error: {e}")
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Missing/invalid request field |
| `INVALID_TOKEN` | Token not supported |
| `INVALID_PAIR` | Trading pair not supported |
| `QUOTE_EXPIRED` | Quote has expired |
| `INSUFFICIENT_LIQUIDITY` | Not enough liquidity |
| `SLIPPAGE_EXCEEDED` | Price moved beyond tolerance |

## Docker Usage

```bash
docker pull deluthium/ccxt:latest

docker run -it \
  -e DELUTHIUM_JWT="your-token" \
  deluthium/ccxt bash

# Inside container
python3 examples/fetch_markets.py
```

## Symbol Format

CCXT uses `BASE/QUOTE` format (e.g., `WBNB/USDT`), while the Deluthium API uses hyphenated format (`WBNB-USDT`). CCXT handles this conversion automatically.

## Important Notes

1. **JWT Required**: All endpoints require JWT authentication
2. **Calldata Only**: `createOrder()` returns calldata for you to broadcast
3. **Wei Units**: Raw API responses use wei (integer strings)
4. **pairId Caching**: After `fetchMarkets()`, pairIds are cached for efficiency

## Support

For API access, contact the Deluthium team at [https://deluthium.ai](https://deluthium.ai).
