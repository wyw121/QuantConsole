import { CandlestickData, OrderBook, PriceData } from "@/types/trading";

// 模拟数据生成器
class MockMarketDataService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isConnected = false;

  // 主要交易对
  private tradingPairs = [
    { symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT" },
    { symbol: "ETHUSDT", baseAsset: "ETH", quoteAsset: "USDT" },
    { symbol: "BNBUSDT", baseAsset: "BNB", quoteAsset: "USDT" },
    { symbol: "ADAUSDT", baseAsset: "ADA", quoteAsset: "USDT" },
    { symbol: "SOLUSDT", baseAsset: "SOL", quoteAsset: "USDT" },
    { symbol: "XRPUSDT", baseAsset: "XRP", quoteAsset: "USDT" },
    { symbol: "DOTUSDT", baseAsset: "DOT", quoteAsset: "USDT" },
    { symbol: "DOGEUSDT", baseAsset: "DOGE", quoteAsset: "USDT" },
    { symbol: "AVAXUSDT", baseAsset: "AVAX", quoteAsset: "USDT" },
    { symbol: "LINKUSDT", baseAsset: "LINK", quoteAsset: "USDT" },
  ];

  // 初始价格数据
  private priceData: Map<string, PriceData> = new Map([
    [
      "BTCUSDT",
      {
        symbol: "BTCUSDT",
        price: 104500,
        priceChange: 2500,
        priceChangePercent: 2.45,
        high24h: 105200,
        low24h: 101800,
        volume24h: 28500000,
        timestamp: Date.now(),
      },
    ],
    [
      "ETHUSDT",
      {
        symbol: "ETHUSDT",
        price: 3850,
        priceChange: -120,
        priceChangePercent: -3.02,
        high24h: 3980,
        low24h: 3780,
        volume24h: 15600000,
        timestamp: Date.now(),
      },
    ],
    [
      "BNBUSDT",
      {
        symbol: "BNBUSDT",
        price: 695,
        priceChange: 15,
        priceChangePercent: 2.21,
        high24h: 708,
        low24h: 668,
        volume24h: 1200000,
        timestamp: Date.now(),
      },
    ],
    [
      "ADAUSDT",
      {
        symbol: "ADAUSDT",
        price: 1.25,
        priceChange: 0.08,
        priceChangePercent: 6.84,
        high24h: 1.28,
        low24h: 1.15,
        volume24h: 890000,
        timestamp: Date.now(),
      },
    ],
    [
      "SOLUSDT",
      {
        symbol: "SOLUSDT",
        price: 245,
        priceChange: -8,
        priceChangePercent: -3.16,
        high24h: 258,
        low24h: 240,
        volume24h: 2100000,
        timestamp: Date.now(),
      },
    ],
    [
      "XRPUSDT",
      {
        symbol: "XRPUSDT",
        price: 3.15,
        priceChange: 0.25,
        priceChangePercent: 8.62,
        high24h: 3.22,
        low24h: 2.88,
        volume24h: 4500000,
        timestamp: Date.now(),
      },
    ],
    [
      "DOTUSDT",
      {
        symbol: "DOTUSDT",
        price: 8.95,
        priceChange: -0.35,
        priceChangePercent: -3.76,
        high24h: 9.45,
        low24h: 8.75,
        volume24h: 560000,
        timestamp: Date.now(),
      },
    ],
    [
      "DOGEUSDT",
      {
        symbol: "DOGEUSDT",
        price: 0.385,
        priceChange: 0.015,
        priceChangePercent: 4.05,
        high24h: 0.398,
        low24h: 0.365,
        volume24h: 1800000,
        timestamp: Date.now(),
      },
    ],
    [
      "AVAXUSDT",
      {
        symbol: "AVAXUSDT",
        price: 45.2,
        priceChange: -1.8,
        priceChangePercent: -3.83,
        high24h: 47.5,
        low24h: 44.1,
        volume24h: 780000,
        timestamp: Date.now(),
      },
    ],
    [
      "LINKUSDT",
      {
        symbol: "LINKUSDT",
        price: 24.8,
        priceChange: 1.2,
        priceChangePercent: 5.08,
        high24h: 25.1,
        low24h: 23.2,
        volume24h: 650000,
        timestamp: Date.now(),
      },
    ],
  ]);

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      // 模拟连接延迟
      setTimeout(() => {
        this.isConnected = true;
        this.startMockDataGeneration();
        resolve(true);
      }, 1000);
    });
  }

  disconnect(): void {
    this.isConnected = false;
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(channel: string, callback: (data: any) => void): void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);
  }

  unsubscribe(channel: string, callback: (data: any) => void): void {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.delete(callback);
      if (channelSubscribers.size === 0) {
        this.subscribers.delete(channel);
      }
    }
  }

  private startMockDataGeneration(): void {
    // 价格数据更新 - 每秒更新
    const priceInterval = setInterval(() => {
      this.updatePrices();
    }, 1000);
    this.intervals.set("prices", priceInterval);

    // K线数据更新 - 每5秒更新
    const candleInterval = setInterval(() => {
      this.updateCandlestickData();
    }, 5000);
    this.intervals.set("candles", candleInterval);

    // 订单簿数据更新 - 每2秒更新
    const orderbookInterval = setInterval(() => {
      this.updateOrderBook();
    }, 2000);
    this.intervals.set("orderbook", orderbookInterval);
  }

  private updatePrices(): void {
    this.priceData.forEach((data, symbol) => {
      // 模拟价格波动 (-0.5% 到 +0.5%)
      const changePercent = (Math.random() - 0.5) * 0.01;
      const newPrice = data.price * (1 + changePercent);
      const priceChange = newPrice - data.price;
      const priceChangePercent = (priceChange / data.price) * 100;

      const updatedData: PriceData = {
        ...data,
        price: Number(newPrice.toFixed(symbol.includes("DOGE") ? 4 : 2)),
        priceChange: Number(priceChange.toFixed(2)),
        priceChangePercent: Number(priceChangePercent.toFixed(2)),
        timestamp: Date.now(),
      };

      this.priceData.set(symbol, updatedData);
      this.notifySubscribers("price", updatedData);
    });
  }

  private updateCandlestickData(): void {
    this.tradingPairs.forEach((pair) => {
      const currentPrice = this.priceData.get(pair.symbol)?.price || 0;
      const candle: CandlestickData = {
        timestamp: Date.now(),
        open: currentPrice * (0.998 + Math.random() * 0.004),
        high: currentPrice * (1.001 + Math.random() * 0.003),
        low: currentPrice * (0.997 + Math.random() * 0.002),
        close: currentPrice,
        volume: Math.random() * 1000,
      };

      this.notifySubscribers("candle", { symbol: pair.symbol, data: candle });
    });
  }

  private updateOrderBook(): void {
    this.tradingPairs.forEach((pair) => {
      const currentPrice = this.priceData.get(pair.symbol)?.price || 0;

      const bids = Array.from({ length: 10 }, (_, i) => ({
        price: currentPrice * (1 - (i + 1) * 0.001),
        amount: Math.random() * 10 + 1,
      }));

      const asks = Array.from({ length: 10 }, (_, i) => ({
        price: currentPrice * (1 + (i + 1) * 0.001),
        amount: Math.random() * 10 + 1,
      }));

      const orderbook: OrderBook = {
        symbol: pair.symbol,
        bids,
        asks,
        timestamp: Date.now(),
      };

      this.notifySubscribers("orderbook", orderbook);
    });
  }

  private notifySubscribers(channel: string, data: any): void {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.forEach((callback) => callback(data));
    }
  }

  // 获取初始数据
  getPriceData(): PriceData[] {
    return Array.from(this.priceData.values());
  }

  getTradingPairs() {
    return this.tradingPairs;
  }

  isConnectedToMarket(): boolean {
    return this.isConnected;
  }

  // 生成历史K线数据
  generateHistoricalCandles(
    symbol: string,
    count: number = 100
  ): CandlestickData[] {
    const currentPrice = this.priceData.get(symbol)?.price || 100;
    const candles: CandlestickData[] = [];
    let price = currentPrice * 0.9; // 从90%的当前价格开始

    for (let i = 0; i < count; i++) {
      const timestamp = Date.now() - (count - i) * 5 * 60 * 1000; // 5分钟间隔
      const volatility = 0.02; // 2%的波动率

      const open = price;
      const change = (Math.random() - 0.5) * volatility;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000 + 100;

      candles.push({
        timestamp,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Number(volume.toFixed(2)),
      });

      price = close;
    }

    return candles;
  }
}

// 单例实例
export const marketDataService = new MockMarketDataService();
