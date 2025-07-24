// 交易相关类型定义

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}

export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  ema20: number;
  ema50: number;
  sma20: number;
  sma50: number;
}

export interface MarketStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex: number;
}

export interface Exchange {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  apiKey?: string;
  secret?: string;
  testnet?: boolean;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  amount: number;
  price: number;
  fee: number;
  timestamp: number;
  status: "pending" | "filled" | "cancelled";
}

export interface Portfolio {
  totalValue: number;
  pnl: number;
  pnlPercent: number;
  assets: Array<{
    symbol: string;
    amount: number;
    value: number;
    price: number;
    change24h: number;
  }>;
}

// WebSocket 消息类型
export interface WebSocketMessage {
  type: "price" | "orderbook" | "trade" | "candle";
  data: any;
  timestamp: number;
}
