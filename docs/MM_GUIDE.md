# Deluthium Market Maker Integration Guide

Complete guide for professional Market Makers integrating with Deluthium DEX.

## Overview

Deluthium (DarkPool) is an RFQ-based DEX that sources liquidity from professional market makers. As an MM, you connect via WebSocket, push order book depth, and respond to quote requests.

## Architecture

```
Your MM System ──WebSocket + Protobuf──> mmhub.deluthium.ai/ws
                                              │
                  ┌───────────────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Quote Request  │ ◄── User wants to swap
         └─────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Quote Response │ ──► Signed quote with price
         └─────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  On-chain Swap  │ ──► Settlement via RFQ Manager
         └─────────────────┘
```

## Prerequisites Checklist

1. **Signer Account**: Create an Ethereum-compatible account for signing quotes
2. **Submit to Deluthium**: Provide your signer address to receive a JWT token
3. **Deploy MMVault**: Deploy the vault contract to hold your funds
4. **Fund Vault**: Deposit tokens you want to market make

## Step 1: Deploy MMVault Contract

Using Foundry:

```bash
forge create src/MMVaultExample.sol:MMVaultExample \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_KEY \
  --constructor-args <WETH_ADDRESS>
```

### WETH Addresses by Chain

| Chain | WETH Address |
|-------|--------------|
| BSC | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` |
| Base | `0x4200000000000000000000000000000000000006` |
| Ethereum | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |

### Configure Vault

```solidity
// Set RFQ Manager
vault.setRFQManager(0x94020Af3571f253754e5566710A89666d90Df615); // BSC

// Set Router
vault.setRouter(0xaAeD8af417B4bF80802fD1B0ccd44d8E15ba33Ff); // BSC
```

## Step 2: WebSocket Connection

Connect to the WebSocket hub with your JWT token:

```typescript
const ws = new WebSocket("wss://mmhub.deluthium.ai/ws", {
  headers: {
    "Authorization": `Bearer ${jwtToken}`
  }
});

ws.on('open', () => {
  console.log('Connected to Deluthium');
});

ws.on('message', (data) => {
  const message = decode(data); // Protobuf decode
  handleMessage(message);
});
```

## Step 3: Connection Acknowledgment

After connecting, you'll receive a `ConnectionAck`:

```typescript
interface ConnectionAck {
  success: boolean;
  session_id: string;
  mm_address: string;
  error_message?: string;
  config: {
    depth_push_interval_ms: number;  // e.g., 1000
    quote_timeout_ms: number;         // e.g., 5000
    heartbeat_interval_ms: number;    // e.g., 30000
  };
}
```

## Step 4: Push Order Book Depth

Push full snapshots at the configured interval:

```typescript
interface DepthSnapshot {
  chain_id: number;
  pair_id: string;           // e.g., "WBNB-USDC"
  token_a: string;           // Base token (WRAPPED address)
  token_b: string;           // Quote token
  bids: PriceLevel[];        // Sorted by price DESCENDING
  asks: PriceLevel[];        // Sorted by price ASCENDING
  sequence_id: number;       // Monotonically increasing
  timestamp: number;
}

interface PriceLevel {
  price: string;   // tokenB/tokenA ratio
  amount: string;  // tokenA quantity in wei
}
```

**Important**: Always use wrapped token addresses (WBNB, WETH), never zero address.

## Step 5: Handle Quote Requests

When a user wants to swap, you receive a `QuoteRequest`:

```typescript
interface QuoteRequest {
  quote_id: string;      // MUST echo in response
  chain_id: number;
  mm_id: string;
  token_in: string;      // May be zero address for native
  token_out: string;     // May be zero address for native
  amount_in: string;     // Wei amount
  recipient: string;
  nonce: string;
  deadline: number;
  slippage_bps: number;
}
```

## Step 6: Sign and Respond

### EIP-712 Domain

```typescript
const domain = {
  name: "DarkPool Pool",
  version: "1",
  chainId: chainId,
  verifyingContract: rfqManagerAddress,
};
```

### MMQuote Type

```typescript
const types = {
  MMQuote: [
    { name: "manager", type: "address" },
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "inputToken", type: "address" },
    { name: "outputToken", type: "address" },
    { name: "amountIn", type: "uint256" },
    { name: "amountOut", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "extraDataHash", type: "bytes32" },
  ],
};
```

### Sign the Quote

```typescript
const extraDataHash = ethers.keccak256(extraData || "0x");

const value = {
  manager: rfqManagerAddress,
  from: request.recipient,
  to: request.recipient,
  inputToken: request.token_in,
  outputToken: request.token_out,
  amountIn: request.amount_in,
  amountOut: calculatedAmountOut,
  deadline: request.deadline,
  nonce: request.nonce,
  extraDataHash: extraDataHash,
};

const signature = await wallet.signTypedData(domain, types, value);
```

### Send Response

```typescript
const response: QuoteResponse = {
  quote_id: request.quote_id,  // Echo back
  status: "QUOTE_STATUS_SUCCESS",
  order: {
    signer: wallet.address,
    manager: rfqManagerAddress,
    from: request.recipient,
    to: request.recipient,
    input_token: request.token_in,   // Keep original
    output_token: request.token_out, // Keep original
    amount_in: request.amount_in,
    amount_out: calculatedAmountOut,
    deadline: request.deadline,
    nonce: request.nonce,
    extra_data: "0x",
    signature: signature,
  }
};

ws.send(encode(response));
```

## Native Token Handling

**Critical**: Handle zero addresses correctly.

```typescript
function processQuoteRequest(request: QuoteRequest): QuoteResponse {
  // Convert zero address to wrapped for pricing
  const pricingTokenIn = isZeroAddress(request.token_in)
    ? getWrappedToken(request.chain_id)
    : request.token_in;
  
  const pricingTokenOut = isZeroAddress(request.token_out)
    ? getWrappedToken(request.chain_id)
    : request.token_out;
  
  // Calculate quote using wrapped tokens
  const amountOut = calculateQuote(pricingTokenIn, pricingTokenOut, request.amount_in);
  
  // Return response with ORIGINAL token addresses
  return {
    quote_id: request.quote_id,
    status: "SUCCESS",
    order: {
      input_token: request.token_in,   // Keep original
      output_token: request.token_out, // Keep original
      amount_out: amountOut,
      // ... other fields
    }
  };
}
```

## Rejecting Quotes

If you can't quote, send a rejection:

```typescript
const reject: QuoteReject = {
  quote_id: request.quote_id,
  reason: "REJECT_REASON_INSUFFICIENT_LIQUIDITY",
  message: "Insufficient liquidity for requested amount"
};

ws.send(encode(reject));
```

### Rejection Reasons

| Reason | When to Use |
|--------|-------------|
| `INSUFFICIENT_LIQUIDITY` | Can't fill the requested amount |
| `PRICE_MOVED` | Market moved during quote |
| `UNSUPPORTED_PAIR` | Don't support this trading pair |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | System error |

## Heartbeat

Respond to heartbeats to keep connection alive:

```typescript
ws.on('message', (data) => {
  const message = decode(data);
  
  if (message.type === 'MESSAGE_TYPE_HEARTBEAT' && message.heartbeat.ping) {
    ws.send(encode({
      type: 'MESSAGE_TYPE_HEARTBEAT',
      heartbeat: { pong: true }
    }));
  }
});
```

## Reference Implementation

Use the Go reference implementation as a starting point:

```bash
docker pull deluthium/mm-example:latest
docker run -e DELUTHIUM_JWT="your-token" deluthium/mm-example
```

Or clone and customize:

```bash
git clone https://github.com/thetafunction/DarkPool-Market-Maker-Example.git
cd DarkPool-Market-Maker-Example
cp configs/config.example.yaml configs/config.yaml
# Edit configs/config.yaml
go run cmd/mm/main.go
```

## Best Practices

### 1. Signer Abstraction

Never use raw private keys in production:

```typescript
interface ISigner {
  getAddress(): Promise<string>;
  signTypedData(domain, types, value): Promise<string>;
}

// Use AWS KMS, HSM, or similar in production
class KmsSigner implements ISigner {
  // ...
}
```

### 2. Error Handling

Implement retry logic with exponential backoff:

```typescript
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

### 3. Monitoring

Log key metrics:
- Quote response latency
- Quote acceptance rate
- Connection uptime
- Error rates

## Support

For API access and integration support, contact the Deluthium team at [https://deluthium.ai](https://deluthium.ai).
