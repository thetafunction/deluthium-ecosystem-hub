#!/usr/bin/env python3
"""
Deluthium - Create Order Example (Python)
Demonstrates how to get a firm quote with calldata for on-chain execution.

IMPORTANT: This returns calldata that YOU must broadcast to the blockchain.
CCXT does NOT execute the transaction automatically.
"""

import os
import ccxt

def main():
    jwt_token = os.environ.get('DELUTHIUM_JWT')
    wallet_address = os.environ.get('WALLET_ADDRESS')
    
    if not jwt_token:
        print("ERROR: DELUTHIUM_JWT environment variable is required")
        return
    
    if not wallet_address:
        print("ERROR: WALLET_ADDRESS environment variable is required")
        print("Set it with: export WALLET_ADDRESS=0xYourWalletAddress")
        return

    exchange = ccxt.deluthium({
        'apiKey': jwt_token,
        'options': {
            'defaultChainId': int(os.environ.get('DELUTHIUM_CHAIN_ID', 56)),
            'defaultSlippage': float(os.environ.get('DELUTHIUM_SLIPPAGE', 0.5)),
        }
    })

    print("Creating order for WBNB/USDT...")
    print("-" * 50)

    try:
        # Load markets first
        exchange.load_markets()
        
        # Create order (get firm quote with calldata)
        order = exchange.create_order(
            symbol='WBNB/USDT',
            type='market',      # Only market orders supported
            side='buy',
            amount=0.1,         # Amount in quote currency (USDT)
            price=None,         # Not used for RFQ
            params={
                'walletAddress': wallet_address,
                'slippage': 0.5,  # 0.5%
            }
        )
        
        print("\nOrder created successfully!")
        print(f"\n  Quote ID: {order['id']}")
        print(f"  Symbol: {order['symbol']}")
        print(f"  Side: {order['side']}")
        print(f"  Amount In: {order['info'].get('amount_in')}")
        print(f"  Amount Out: {order['info'].get('amount_out')}")
        print(f"  Deadline: {order['info'].get('deadline')}")
        
        print(f"\n  Router Address: {order['info'].get('router_address')}")
        print(f"\n  Calldata (first 100 chars):")
        calldata = order['info'].get('calldata', '')
        print(f"    {calldata[:100]}...")
        
        print("\n" + "=" * 50)
        print("IMPORTANT: You must broadcast this transaction yourself!")
        print("Use web3.py or ethers.js to send the calldata to the router.")
        print("=" * 50)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
