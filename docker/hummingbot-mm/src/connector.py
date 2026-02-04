"""
Deluthium WebSocket Market Maker Connector

Connects to Deluthium's WebSocket hub to:
1. Push order book depth
2. Receive and respond to quote requests
3. Handle heartbeats and reconnection
"""

import asyncio
import json
import logging
import time
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional, Callable

import websockets
from eth_account import Account
from eth_account.messages import encode_typed_data

logger = logging.getLogger(__name__)


class MessageType(str, Enum):
    AUTH = "auth"
    AUTH_RESPONSE = "auth_response"
    DEPTH_UPDATE = "depth_update"
    QUOTE_REQUEST = "quote_request"
    QUOTE_RESPONSE = "quote_response"
    QUOTE_REJECT = "quote_reject"
    HEARTBEAT = "heartbeat"
    ERROR = "error"


class QuoteStatus(str, Enum):
    SUCCESS = "QUOTE_STATUS_SUCCESS"
    REJECTED = "QUOTE_STATUS_REJECTED"


class RejectReason(str, Enum):
    INSUFFICIENT_LIQUIDITY = "REJECT_REASON_INSUFFICIENT_LIQUIDITY"
    PRICE_MOVED = "REJECT_REASON_PRICE_MOVED"
    UNSUPPORTED_PAIR = "REJECT_REASON_UNSUPPORTED_PAIR"
    RATE_LIMITED = "REJECT_REASON_RATE_LIMITED"
    INTERNAL_ERROR = "REJECT_REASON_INTERNAL_ERROR"


@dataclass
class PriceLevel:
    price: Decimal
    amount: Decimal


@dataclass
class TradingPair:
    chain_id: int
    base_token: str
    quote_token: str
    bid_spread_bps: int = 30
    ask_spread_bps: int = 30
    order_amount: Decimal = Decimal("1.0")
    min_order_size: Decimal = Decimal("0.01")
    max_order_size: Decimal = Decimal("1000.0")
    levels: List[Dict] = field(default_factory=list)


@dataclass
class QuoteRequest:
    quote_id: str
    chain_id: int
    mm_id: str
    token_in: str
    token_out: str
    amount_in: str
    recipient: str
    nonce: str
    deadline: int
    slippage_bps: int


@dataclass
class ConnectionConfig:
    depth_push_interval_ms: int = 1000
    quote_timeout_ms: int = 5000
    heartbeat_interval_ms: int = 30000


# RFQ Manager addresses by chain
RFQ_MANAGERS = {
    56: "0x94020Af3571f253754e5566710A89666d90Df615",    # BSC
    8453: "0x7648CE928efa92372E2bb34086421a8a1702bD36",  # Base
}

# Wrapped native token addresses
WRAPPED_TOKENS = {
    56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",    # WBNB
    8453: "0x4200000000000000000000000000000000000006",  # WETH
}

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


class DeluthiumMMConnector:
    """
    Market Maker WebSocket Connector for Deluthium DEX.
    
    Example usage:
        connector = DeluthiumMMConnector(
            jwt_token="your-jwt",
            signer_key="your-private-key",
            chain_id=56,
        )
        connector.add_pair(TradingPair(...))
        connector.set_price_callback(your_price_function)
        await connector.start()
    """

    def __init__(
        self,
        jwt_token: str,
        signer_key: str,
        chain_id: int = 56,
        ws_url: str = "wss://mmhub.deluthium.ai/ws",
    ):
        self.jwt_token = jwt_token
        self.signer = Account.from_key(signer_key)
        self.chain_id = chain_id
        self.ws_url = ws_url
        
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.session_id: Optional[str] = None
        self.config = ConnectionConfig()
        
        self.pairs: Dict[str, TradingPair] = {}
        self.price_callback: Optional[Callable] = None
        
        self._running = False
        self._depth_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._reconnect_delay = 1
        self._max_reconnect_delay = 60
        
        # Metrics
        self.metrics = {
            "quotes_received": 0,
            "quotes_responded": 0,
            "quotes_rejected": 0,
            "depth_pushes": 0,
            "reconnections": 0,
        }

    def add_pair(self, pair: TradingPair) -> None:
        """Add a trading pair to market make."""
        pair_id = f"{pair.base_token}-{pair.quote_token}"
        self.pairs[pair_id] = pair
        logger.info(f"Added pair: {pair_id}")

    def set_price_callback(self, callback: Callable[[str, str], Decimal]) -> None:
        """
        Set callback function to get mid prices.
        
        Args:
            callback: Function(base_token, quote_token) -> mid_price
        """
        self.price_callback = callback

    async def start(self) -> None:
        """Start the market maker connector."""
        self._running = True
        while self._running:
            try:
                await self._connect_and_run()
            except Exception as e:
                logger.error(f"Connection error: {e}")
                if self._running:
                    self.metrics["reconnections"] += 1
                    await asyncio.sleep(self._reconnect_delay)
                    self._reconnect_delay = min(
                        self._reconnect_delay * 2,
                        self._max_reconnect_delay
                    )

    async def stop(self) -> None:
        """Stop the market maker connector."""
        self._running = False
        if self._depth_task:
            self._depth_task.cancel()
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
        if self.ws:
            await self.ws.close()

    async def _connect_and_run(self) -> None:
        """Connect to WebSocket and handle messages."""
        headers = {"Authorization": f"Bearer {self.jwt_token}"}
        
        async with websockets.connect(self.ws_url, extra_headers=headers) as ws:
            self.ws = ws
            self._reconnect_delay = 1  # Reset on successful connection
            logger.info("Connected to Deluthium WebSocket hub")
            
            # Wait for connection acknowledgment
            await self._handle_connection_ack()
            
            # Start background tasks
            self._depth_task = asyncio.create_task(self._depth_push_loop())
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            
            # Main message loop
            async for message in ws:
                await self._handle_message(message)

    async def _handle_connection_ack(self) -> None:
        """Handle initial connection acknowledgment."""
        message = await self.ws.recv()
        data = json.loads(message)
        
        if data.get("type") == "auth_response":
            if data.get("success"):
                self.session_id = data.get("session_id")
                if "config" in data:
                    cfg = data["config"]
                    self.config.depth_push_interval_ms = cfg.get(
                        "depth_push_interval_ms", 1000
                    )
                    self.config.quote_timeout_ms = cfg.get(
                        "quote_timeout_ms", 5000
                    )
                    self.config.heartbeat_interval_ms = cfg.get(
                        "heartbeat_interval_ms", 30000
                    )
                logger.info(f"Authenticated. Session: {self.session_id}")
            else:
                raise Exception(f"Auth failed: {data.get('error_message')}")

    async def _handle_message(self, raw_message: str) -> None:
        """Route incoming messages to appropriate handlers."""
        try:
            data = json.loads(raw_message)
            msg_type = data.get("type")
            
            if msg_type == MessageType.QUOTE_REQUEST:
                await self._handle_quote_request(data)
            elif msg_type == MessageType.HEARTBEAT:
                if data.get("heartbeat", {}).get("ping"):
                    await self._send_heartbeat_pong()
            elif msg_type == MessageType.ERROR:
                logger.error(f"Server error: {data.get('message')}")
            else:
                logger.debug(f"Unhandled message type: {msg_type}")
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse message: {e}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")

    async def _handle_quote_request(self, data: dict) -> None:
        """Handle incoming quote request."""
        self.metrics["quotes_received"] += 1
        
        try:
            request = QuoteRequest(
                quote_id=data["quote_id"],
                chain_id=data["chain_id"],
                mm_id=data["mm_id"],
                token_in=data["token_in"],
                token_out=data["token_out"],
                amount_in=data["amount_in"],
                recipient=data["recipient"],
                nonce=data["nonce"],
                deadline=data["deadline"],
                slippage_bps=data.get("slippage_bps", 50),
            )
            
            logger.info(
                f"Quote request: {request.quote_id} "
                f"{request.amount_in} {request.token_in} -> {request.token_out}"
            )
            
            # Find matching pair
            pair = self._find_pair(request.token_in, request.token_out)
            if not pair:
                await self._send_reject(
                    request.quote_id,
                    RejectReason.UNSUPPORTED_PAIR,
                    "Pair not supported"
                )
                return
            
            # Calculate quote
            amount_out = self._calculate_quote(request, pair)
            if amount_out is None:
                await self._send_reject(
                    request.quote_id,
                    RejectReason.INSUFFICIENT_LIQUIDITY,
                    "Cannot provide quote"
                )
                return
            
            # Sign and respond
            await self._send_quote_response(request, str(amount_out))
            self.metrics["quotes_responded"] += 1
            
        except Exception as e:
            logger.error(f"Error handling quote: {e}")
            await self._send_reject(
                data.get("quote_id", ""),
                RejectReason.INTERNAL_ERROR,
                str(e)
            )

    def _find_pair(
        self, token_in: str, token_out: str
    ) -> Optional[TradingPair]:
        """Find matching trading pair."""
        # Normalize zero address to wrapped token
        wrapped = WRAPPED_TOKENS.get(self.chain_id, "")
        if token_in == ZERO_ADDRESS:
            token_in = wrapped
        if token_out == ZERO_ADDRESS:
            token_out = wrapped
            
        # Try both directions
        pair_id = f"{token_in}-{token_out}"
        if pair_id in self.pairs:
            return self.pairs[pair_id]
        
        reverse_id = f"{token_out}-{token_in}"
        if reverse_id in self.pairs:
            return self.pairs[reverse_id]
        
        return None

    def _calculate_quote(
        self, request: QuoteRequest, pair: TradingPair
    ) -> Optional[int]:
        """Calculate output amount for quote request."""
        try:
            amount_in = Decimal(request.amount_in)
            
            # Check order size limits
            if amount_in < pair.min_order_size * Decimal(10**18):
                return None
            if amount_in > pair.max_order_size * Decimal(10**18):
                return None
            
            # Get mid price
            if self.price_callback:
                mid_price = self.price_callback(
                    request.token_in, request.token_out
                )
            else:
                # Fallback: assume 1:1 for demo
                mid_price = Decimal("1.0")
            
            # Determine spread based on direction
            wrapped = WRAPPED_TOKENS.get(self.chain_id, "")
            token_in_normalized = (
                wrapped if request.token_in == ZERO_ADDRESS 
                else request.token_in
            )
            
            if token_in_normalized.lower() == pair.base_token.lower():
                # Selling base token -> use bid spread
                spread_bps = pair.bid_spread_bps
            else:
                # Buying base token -> use ask spread
                spread_bps = pair.ask_spread_bps
            
            # Apply spread
            spread_factor = Decimal(1) - Decimal(spread_bps) / Decimal(10000)
            amount_out = amount_in * mid_price * spread_factor
            
            return int(amount_out)
            
        except Exception as e:
            logger.error(f"Quote calculation error: {e}")
            return None

    async def _send_quote_response(
        self, request: QuoteRequest, amount_out: str
    ) -> None:
        """Sign and send quote response."""
        rfq_manager = RFQ_MANAGERS.get(self.chain_id)
        if not rfq_manager:
            raise ValueError(f"Unknown chain ID: {self.chain_id}")
        
        # Build EIP-712 signature
        domain = {
            "name": "DarkPool Pool",
            "version": "1",
            "chainId": self.chain_id,
            "verifyingContract": rfq_manager,
        }
        
        types = {
            "MMQuote": [
                {"name": "manager", "type": "address"},
                {"name": "from", "type": "address"},
                {"name": "to", "type": "address"},
                {"name": "inputToken", "type": "address"},
                {"name": "outputToken", "type": "address"},
                {"name": "amountIn", "type": "uint256"},
                {"name": "amountOut", "type": "uint256"},
                {"name": "deadline", "type": "uint256"},
                {"name": "nonce", "type": "uint256"},
                {"name": "extraDataHash", "type": "bytes32"},
            ]
        }
        
        # Hash of empty extra data
        extra_data_hash = (
            "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
        )
        
        message = {
            "manager": rfq_manager,
            "from": request.recipient,
            "to": request.recipient,
            "inputToken": request.token_in,
            "outputToken": request.token_out,
            "amountIn": int(request.amount_in),
            "amountOut": int(amount_out),
            "deadline": request.deadline,
            "nonce": int(request.nonce),
            "extraDataHash": extra_data_hash,
        }
        
        # Sign the typed data
        signable = encode_typed_data(
            domain_data=domain,
            message_types=types,
            message_data=message,
        )
        signed = self.signer.sign_message(signable)
        signature = signed.signature.hex()
        
        response = {
            "type": MessageType.QUOTE_RESPONSE,
            "quote_id": request.quote_id,
            "status": QuoteStatus.SUCCESS,
            "order": {
                "signer": self.signer.address,
                "manager": rfq_manager,
                "from": request.recipient,
                "to": request.recipient,
                "input_token": request.token_in,
                "output_token": request.token_out,
                "amount_in": request.amount_in,
                "amount_out": amount_out,
                "deadline": request.deadline,
                "nonce": request.nonce,
                "extra_data": "0x",
                "signature": f"0x{signature}",
            }
        }
        
        await self.ws.send(json.dumps(response))
        logger.info(f"Quote response sent: {request.quote_id}")

    async def _send_reject(
        self, quote_id: str, reason: RejectReason, message: str
    ) -> None:
        """Send quote rejection."""
        self.metrics["quotes_rejected"] += 1
        
        reject = {
            "type": MessageType.QUOTE_REJECT,
            "quote_id": quote_id,
            "reason": reason.value,
            "message": message,
        }
        
        await self.ws.send(json.dumps(reject))
        logger.info(f"Quote rejected: {quote_id} - {reason.value}")

    async def _depth_push_loop(self) -> None:
        """Periodically push order book depth."""
        interval = self.config.depth_push_interval_ms / 1000
        sequence_id = 0
        
        while self._running:
            try:
                for pair_id, pair in self.pairs.items():
                    depth = self._build_depth_snapshot(pair, sequence_id)
                    await self.ws.send(json.dumps(depth))
                    self.metrics["depth_pushes"] += 1
                    sequence_id += 1
                    
                await asyncio.sleep(interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Depth push error: {e}")
                await asyncio.sleep(1)

    def _build_depth_snapshot(
        self, pair: TradingPair, sequence_id: int
    ) -> dict:
        """Build depth snapshot for a trading pair."""
        # Get mid price
        if self.price_callback:
            mid_price = self.price_callback(pair.base_token, pair.quote_token)
        else:
            mid_price = Decimal("1.0")
        
        bids = []
        asks = []
        
        if pair.levels:
            # Multi-level order book
            for level in pair.levels:
                spread_bps = level.get("spread_bps", 30)
                amount = Decimal(str(level.get("amount", "1.0")))
                
                bid_price = mid_price * (1 - Decimal(spread_bps) / 10000)
                ask_price = mid_price * (1 + Decimal(spread_bps) / 10000)
                
                bids.append({
                    "price": str(bid_price),
                    "amount": str(int(amount * Decimal(10**18)))
                })
                asks.append({
                    "price": str(ask_price),
                    "amount": str(int(amount * Decimal(10**18)))
                })
        else:
            # Single level
            bid_price = mid_price * (1 - Decimal(pair.bid_spread_bps) / 10000)
            ask_price = mid_price * (1 + Decimal(pair.ask_spread_bps) / 10000)
            
            bids.append({
                "price": str(bid_price),
                "amount": str(int(pair.order_amount * Decimal(10**18)))
            })
            asks.append({
                "price": str(ask_price),
                "amount": str(int(pair.order_amount * Decimal(10**18)))
            })
        
        # Sort: bids descending, asks ascending
        bids.sort(key=lambda x: Decimal(x["price"]), reverse=True)
        asks.sort(key=lambda x: Decimal(x["price"]))
        
        return {
            "type": MessageType.DEPTH_UPDATE,
            "chain_id": pair.chain_id,
            "pair_id": f"{pair.base_token}-{pair.quote_token}",
            "token_a": pair.base_token,
            "token_b": pair.quote_token,
            "bids": bids,
            "asks": asks,
            "sequence_id": sequence_id,
            "timestamp": int(time.time() * 1000),
        }

    async def _heartbeat_loop(self) -> None:
        """Send periodic heartbeats."""
        interval = self.config.heartbeat_interval_ms / 1000
        
        while self._running:
            try:
                await asyncio.sleep(interval)
                await self._send_heartbeat()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")

    async def _send_heartbeat(self) -> None:
        """Send heartbeat ping."""
        heartbeat = {
            "type": MessageType.HEARTBEAT,
            "heartbeat": {"ping": True},
            "timestamp": int(time.time() * 1000),
        }
        await self.ws.send(json.dumps(heartbeat))

    async def _send_heartbeat_pong(self) -> None:
        """Respond to heartbeat ping."""
        pong = {
            "type": MessageType.HEARTBEAT,
            "heartbeat": {"pong": True},
            "timestamp": int(time.time() * 1000),
        }
        await self.ws.send(json.dumps(pong))

    def get_metrics(self) -> dict:
        """Return current metrics."""
        return self.metrics.copy()
