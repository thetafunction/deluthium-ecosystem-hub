#!/usr/bin/env node
/**
 * Deluthium CCXT Example: Fetch Ticker
 * 
 * Demonstrates how to fetch price ticker for a trading pair.
 * 
 * Usage:
 *   export DELUTHIUM_JWT="your-jwt-token"
 *   node fetch_ticker.js [SYMBOL]
 * 
 * Examples:
 *   node fetch_ticker.js WBNB/USDT
 *   node fetch_ticker.js ETH/USDT
 * 
 * Or with Docker:
 *   docker-compose run ccxt node examples/fetch_ticker.js WBNB/USDT
 */

const ccxt = require('ccxt');

async function main() {
    // Get JWT token from environment
    const jwtToken = process.env.DELUTHIUM_JWT;
    if (!jwtToken) {
        console.error('Error: DELUTHIUM_JWT environment variable not set');
        console.error('Usage: export DELUTHIUM_JWT="your-token" && node fetch_ticker.js');
        process.exit(1);
    }

    // Get symbol from args or use default
    const symbol = process.argv[2] || 'WBNB/USDT';

    // Get chain ID (default: BSC = 56)
    const chainId = parseInt(process.env.DELUTHIUM_CHAIN_ID || '56', 10);

    console.log(`Connecting to Deluthium DEX (Chain ID: ${chainId})...`);
    console.log(`Fetching ticker for: ${symbol}`);
    console.log();

    // Initialize exchange
    const exchange = new ccxt.deluthium({
        apiKey: jwtToken,
        options: {
            defaultChainId: chainId,
        }
    });

    try {
        // Fetch ticker
        const ticker = await exchange.fetchTicker(symbol);

        console.log('Ticker Information:');
        console.log('==================');
        console.log(`Symbol:     ${ticker.symbol}`);
        console.log(`Last Price: ${ticker.last}`);
        console.log(`Bid:        ${ticker.bid}`);
        console.log(`Ask:        ${ticker.ask}`);
        console.log(`High 24h:   ${ticker.high}`);
        console.log(`Low 24h:    ${ticker.low}`);
        console.log(`Volume 24h: ${ticker.baseVolume}`);
        console.log(`Timestamp:  ${new Date(ticker.timestamp).toISOString()}`);

    } catch (error) {
        if (error instanceof ccxt.AuthenticationError) {
            console.error(`Authentication Error: ${error.message}`);
            console.error('Check your JWT token is valid.');
        } else if (error instanceof ccxt.NetworkError) {
            console.error(`Network Error: ${error.message}`);
            console.error('Check your internet connection.');
        } else if (error instanceof ccxt.BadSymbol) {
            console.error(`Invalid Symbol: ${symbol}`);
            console.error('Use fetch_markets.py to see available pairs.');
        } else {
            console.error(`Error: ${error.message}`);
        }
        process.exit(1);
    }
}

main();
