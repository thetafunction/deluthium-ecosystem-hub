#!/usr/bin/env python3
"""
Deluthium CCXT Example: Fetch Markets

Demonstrates how to fetch all available trading pairs from Deluthium DEX.

Usage:
    export DELUTHIUM_JWT="your-jwt-token"
    python3 fetch_markets.py

Or with Docker:
    docker-compose run ccxt python3 examples/fetch_markets.py
"""

import os
import sys

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
        print("Usage: export DELUTHIUM_JWT='your-token' && python3 fetch_markets.py")
        sys.exit(1)

    # Get chain ID (default: BSC = 56)
    chain_id = int(os.environ.get("DELUTHIUM_CHAIN_ID", "56"))

    print(f"Connecting to Deluthium DEX (Chain ID: {chain_id})...")
    print()

    # Initialize exchange
    exchange = ccxt.deluthium({
        "apiKey": jwt_token,
        "options": {
            "defaultChainId": chain_id,
        }
    })

    try:
        # Fetch markets
        markets = exchange.fetch_markets()

        print(f"Found {len(markets)} trading pairs:\n")
        print(f"{'Symbol':<20} {'Base':<10} {'Quote':<10} {'Active':<8}")
        print("-" * 50)

        for market in markets:
            symbol = market.get("symbol", "N/A")
            base = market.get("base", "N/A")
            quote = market.get("quote", "N/A")
            active = "Yes" if market.get("active") else "No"
            print(f"{symbol:<20} {base:<10} {quote:<10} {active:<8}")

        print()
        print(f"Total: {len(markets)} pairs")

    except ccxt.AuthenticationError as e:
        print(f"Authentication Error: {e}")
        print("Check your JWT token is valid.")
        sys.exit(1)
    except ccxt.NetworkError as e:
        print(f"Network Error: {e}")
        print("Check your internet connection.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
