#!/usr/bin/env python3
"""
Deluthium Market Maker - Hummingbot WebSocket Connector

Connects to Deluthium DEX WebSocket hub as a Market Maker.
Pushes order book depth and responds to quote requests.

Usage:
    python main.py --config /conf/strategies/deluthium_mm.yml
    
Environment Variables:
    DELUTHIUM_JWT - JWT token for authentication (required)
    MM_SIGNER_KEY - Private key for signing quotes (required)
    DELUTHIUM_CHAIN_ID - Chain ID (default: 56)
    WS_URL - WebSocket URL (default: wss://mmhub.deluthium.ai/ws)
"""

import argparse
import asyncio
import logging
import os
import signal
import sys
from decimal import Decimal
from typing import Optional

import yaml

from connector import DeluthiumMMConnector, TradingPair

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/logs/hummingbot_mm.log") if os.path.exists("/logs") else logging.NullHandler(),
    ]
)
logger = logging.getLogger("deluthium_mm")


class PriceFeed:
    """Simple price feed - replace with real implementation."""
    
    def __init__(self, source: str = "static", config: dict = None):
        self.source = source
        self.config = config or {}
        self._prices: dict = {}
        
    async def start(self) -> None:
        """Start price feed updates."""
        if self.source == "static":
            # Use static prices from config
            for pair in self.config.get("pairs", []):
                key = f"{pair.get('base')}-{pair.get('quote')}"
                self._prices[key] = Decimal(str(pair.get("price", "1.0")))
        elif self.source == "binance":
            # TODO: Implement Binance price feed
            logger.info("Binance price feed not implemented, using fallback")
        
    def get_price(self, base_token: str, quote_token: str) -> Decimal:
        """Get mid price for a token pair."""
        key = f"{base_token}-{quote_token}"
        if key in self._prices:
            return self._prices[key]
        
        # Try reverse
        reverse_key = f"{quote_token}-{base_token}"
        if reverse_key in self._prices:
            return Decimal("1") / self._prices[reverse_key]
        
        # Fallback
        logger.warning(f"No price for {key}, using 1.0")
        return Decimal("1.0")
    
    def set_price(self, base_token: str, quote_token: str, price: Decimal) -> None:
        """Manually set price for testing."""
        key = f"{base_token}-{quote_token}"
        self._prices[key] = price


def load_config(config_path: str) -> dict:
    """Load configuration from YAML file."""
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def create_connector(config: dict) -> DeluthiumMMConnector:
    """Create and configure the MM connector."""
    # Get credentials from environment
    jwt_token = os.environ.get("DELUTHIUM_JWT")
    signer_key = os.environ.get("MM_SIGNER_KEY")
    
    if not jwt_token:
        raise ValueError("DELUTHIUM_JWT environment variable is required")
    if not signer_key:
        raise ValueError("MM_SIGNER_KEY environment variable is required")
    
    chain_id = int(os.environ.get("DELUTHIUM_CHAIN_ID", config.get("chain_id", 56)))
    ws_url = os.environ.get("WS_URL", config.get("ws_url", "wss://mmhub.deluthium.ai/ws"))
    
    connector = DeluthiumMMConnector(
        jwt_token=jwt_token,
        signer_key=signer_key,
        chain_id=chain_id,
        ws_url=ws_url,
    )
    
    # Add trading pairs
    for pair_config in config.get("pairs", []):
        pair = TradingPair(
            chain_id=chain_id,
            base_token=pair_config["base"],
            quote_token=pair_config["quote"],
            bid_spread_bps=pair_config.get("bid_spread_bps", 30),
            ask_spread_bps=pair_config.get("ask_spread_bps", 30),
            order_amount=Decimal(str(pair_config.get("order_amount", "1.0"))),
            min_order_size=Decimal(str(pair_config.get("min_order_size", "0.01"))),
            max_order_size=Decimal(str(pair_config.get("max_order_size", "1000.0"))),
            levels=pair_config.get("levels", []),
        )
        connector.add_pair(pair)
    
    return connector


async def main(config_path: str) -> None:
    """Main entry point."""
    logger.info("=" * 50)
    logger.info("Deluthium Market Maker - Hummingbot WebSocket")
    logger.info("=" * 50)
    
    # Load configuration
    config = load_config(config_path)
    logger.info(f"Loaded config: {config_path}")
    
    # Initialize price feed
    price_feed = PriceFeed(
        source=config.get("price_source", "static"),
        config=config,
    )
    await price_feed.start()
    
    # Create connector
    connector = create_connector(config)
    connector.set_price_callback(price_feed.get_price)
    
    # Handle shutdown
    loop = asyncio.get_event_loop()
    
    def shutdown_handler():
        logger.info("Shutdown requested...")
        asyncio.create_task(connector.stop())
    
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown_handler)
    
    # Start connector
    logger.info(f"Starting Market Maker on chain {connector.chain_id}")
    logger.info(f"Pairs: {list(connector.pairs.keys())}")
    logger.info(f"WebSocket: {connector.ws_url}")
    
    try:
        await connector.start()
    except asyncio.CancelledError:
        pass
    finally:
        logger.info("Market Maker stopped")
        logger.info(f"Final metrics: {connector.get_metrics()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deluthium Market Maker")
    parser.add_argument(
        "--config",
        type=str,
        default="/conf/strategies/deluthium_mm.yml",
        help="Path to configuration file",
    )
    args = parser.parse_args()
    
    # Check config exists
    if not os.path.exists(args.config):
        logger.error(f"Config file not found: {args.config}")
        sys.exit(1)
    
    asyncio.run(main(args.config))
