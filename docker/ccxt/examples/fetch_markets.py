#!/usr/bin/env python3
"""
Deluthium - Fetch Markets Example (Python)
Demonstrates how to fetch all trading pairs from Deluthium DEX.
"""

import os
import ccxt

def main():
    # Initialize exchange with JWT token
    jwt_token = os.environ.get('DELUTHIUM_JWT')
    if not jwt_token:
        print("ERROR: DELUTHIUM_JWT environment variable is required")
        return

    exchange = ccxt.deluthium({
        'apiKey': jwt_token,
        'options': {
            'defaultChainId': int(os.environ.get('DELUTHIUM_CHAIN_ID', 56)),
            'defaultSlippage': float(os.environ.get('DELUTHIUM_SLIPPAGE', 0.5)),
        }
    })

    print("Fetching markets from Deluthium...")
    print("-" * 50)

    try:
        markets = exchange.fetch_markets()
        
        print(f"Found {len(markets)} trading pairs:\n")
        
        for market in markets[:10]:  # Show first 10
            print(f"  {market['symbol']}")
            print(f"    Base: {market['base']}")
            print(f"    Quote: {market['quote']}")
            print(f"    Active: {market['active']}")
            print()
        
        if len(markets) > 10:
            print(f"  ... and {len(markets) - 10} more pairs")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
