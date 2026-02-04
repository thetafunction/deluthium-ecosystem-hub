#!/usr/bin/env python3
"""
Deluthium CCXT Example: Get Quote

Demonstrates how to get an indicative quote for a swap.

Usage:
    export DELUTHIUM_JWT="your-jwt-token"
    python3 get_quote.py [SYMBOL] [AMOUNT] [SIDE]

Examples:
    python3 get_quote.py WBNB/USDT 1.0 buy
    python3 get_quote.py ETH/USDT 0.5 sell

Or with Docker:
    docker-compose run ccxt python3 examples/get_quote.py WBNB/USDT 1.0 buy
"""

import os
import sys
from decimal import Decimal

try:
    import ccxt
except ImportError:
    print("Error: CCXT not installed. Run: pip install ccxt")
    sys.exit(1)


def main():
    # Get JWT token from environment
    jwt_token = os.environ.get("DELUTHIUM_JWT")
    if not jwt_token:
        print("Error: DELUTHIUM_JWT environment variable not set")
        print("Usage: export DELUTHIUM_JWT='your-token' && python3 get_quote.py")
        sys.exit(1)

    # Parse arguments
    symbol = sys.argv[1] if len(sys.argv) > 1 else "WBNB/USDT"
    amount = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
    side = sys.argv[3].lower() if len(sys.argv) > 3 else "buy"

    if side not in ["buy", "sell"]:
        print("Error: Side must be 'buy' or 'sell'")
        sys.exit(1)

    # Get chain ID (default: BSC = 56)
    chain_id = int(os.environ.get("DELUTHIUM_CHAIN_ID", "56"))
    slippage = float(os.environ.get("DELUTHIUM_SLIPPAGE", "0.5"))

    print(f"Connecting to Deluthium DEX (Chain ID: {chain_id})...")
    print()

    # Initialize exchange
    exchange = ccxt.deluthium({
        "apiKey": jwt_token,
        "options": {
            "defaultChainId": chain_id,
            "defaultSlippage": slippage,
        }
    })

    try:
        print(f"Requesting quote:")
        print(f"  Symbol: {symbol}")
        print(f"  Amount: {amount}")
        print(f"  Side:   {side}")
        print(f"  Slippage: {slippage}%")
        print()

        # Get indicative quote
        # Note: This uses the internal fetchQuote method
        quote = exchange.fetch_quote(symbol, amount, side)

        print("Quote Received:")
        print("===============")
        print(f"Input Amount:    {quote.get('amount_in', 'N/A')}")
        print(f"Output Amount:   {quote.get('amount_out', 'N/A')}")
        print(f"Price:           {quote.get('price', 'N/A')}")
        print(f"Price Impact:    {quote.get('price_impact', 'N/A')}%")
        print(f"Valid Until:     {quote.get('valid_until', 'N/A')}")
        print()
        print("Note: This is an indicative quote. Use create_order for a firm quote.")

    except ccxt.AuthenticationError as e:
        print(f"Authentication Error: {e}")
        print("Check your JWT token is valid.")
        sys.exit(1)
    except ccxt.NetworkError as e:
        print(f"Network Error: {e}")
        print("Check your internet connection.")
        sys.exit(1)
    except ccxt.BadSymbol as e:
        print(f"Invalid Symbol: {symbol}")
        print("Use fetch_markets.py to see available pairs.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
