#!/usr/bin/env node
/**
 * Deluthium - Fetch Ticker Example (JavaScript)
 * Demonstrates how to fetch price data for a trading pair.
 */

const ccxt = require('ccxt');

async function main() {
    const jwtToken = process.env.DELUTHIUM_JWT;
    if (!jwtToken) {
        console.error('ERROR: DELUTHIUM_JWT environment variable is required');
        process.exit(1);
    }

    const exchange = new ccxt.deluthium({
        apiKey: jwtToken,
        options: {
            defaultChainId: parseInt(process.env.DELUTHIUM_CHAIN_ID || '56'),
            defaultSlippage: parseFloat(process.env.DELUTHIUM_SLIPPAGE || '0.5'),
        }
    });

    console.log('Fetching ticker for WBNB/USDT...');
    console.log('-'.repeat(50));

    try {
        // First load markets to cache pairIds
        await exchange.loadMarkets();
        
        const ticker = await exchange.fetchTicker('WBNB/USDT');
        
        console.log('\nTicker Data:');
        console.log(`  Symbol: ${ticker.symbol}`);
        console.log(`  Last Price: ${ticker.last}`);
        console.log(`  Bid: ${ticker.bid}`);
        console.log(`  Ask: ${ticker.ask}`);
        console.log(`  24h High: ${ticker.high}`);
        console.log(`  24h Low: ${ticker.low}`);
        console.log(`  24h Volume: ${ticker.baseVolume}`);
        console.log(`  24h Quote Volume: ${ticker.quoteVolume}`);
        console.log(`  Timestamp: ${new Date(ticker.timestamp).toISOString()}`);
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();
