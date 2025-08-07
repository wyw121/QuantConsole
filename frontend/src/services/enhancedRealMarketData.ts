import { CandlestickData, OrderBook, PriceData } from "@/types/trading";
import { realKlineDataService } from "./realKlineDataService";

/**
 * 增强版真实市场数据服务
 * 结合多个API源提供完整的实时数据
 */
class EnhancedRealMarketDataService {
  private isConnected = false;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private candleUpdateInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // 多个数据源API
  private readonly COINGECKO_BASE = "https://api.coingecko.com/api/v3";
  private readonly BINANCE_BASE = "https://api.binance.com/api/v3";

  // WebSocket 连接用于实时数据
  private ws: WebSocket | null = null;
  private readonly BINANCE_WS = "wss://stream.binance.com:9443/ws";

  // 支持的交易对
  private tradingPairs = [
    {
      symbol: "BTCUSDT",
      baseAsset: "BTC",
      quoteAsset: "USDT",
      coinGeckoId: "bitcoin",
    },
    {
      symbol: "ETHUSDT",
      baseAsset: "ETH",
      quoteAsset: "USDT",
      coinGeckoId: "ethereum",
    },
    {
      symbol: "BNBUSDT",
      baseAsset: "BNB",
      quoteAsset: "USDT",
      coinGeckoId: "binancecoin",
    },
    {
      symbol: "ADAUSDT",
      baseAsset: "ADA",
      quoteAsset: "USDT",
      coinGeckoId: "cardano",
    },
    {
      symbol: "SOLUSDT",
      baseAsset: "SOL",
      quoteAsset: "USDT",
      coinGeckoId: "solana",
    },
    {
      symbol: "XRPUSDT",
      baseAsset: "XRP",
      quoteAsset: "USDT",
      coinGeckoId: "ripple",
    },
    {
      symbol: "DOTUSDT",
      baseAsset: "DOT",
      quoteAsset: "USDT",
      coinGeckoId: "polkadot",
    },
    {
      symbol: "DOGEUSDT",
      baseAsset: "DOGE",
      quoteAsset: "USDT",
      coinGeckoId: "dogecoin",
    },
    {
      symbol: "AVAXUSDT",
      baseAsset: "AVAX",
      quoteAsset: "USDT",
      coinGeckoId: "avalanche-2",
    },
    {
      symbol: "LINKUSDT",
      baseAsset: "LINK",
      quoteAsset: "USDT",
      coinGeckoId: "chainlink",
    },
  ];

  // 数据缓存
  private priceDataCache: Map<string, PriceData> = new Map();
  private orderBookCache: Map<string, OrderBook> = new Map();
  private candleDataCache: Map<string, CandlestickData[]> = new Map();
  private lastUpdateTime = 0;

  /**
   * 连接到真实市场数据
   */
  async connect(): Promise<boolean> {
    try {
      console.log("🚀 连接到增强版真实市场数据服务...");

      // 1. 获取初始价格数据
      await this.fetchRealPriceData();

      // 2. 获取初始K线数据
      await this.fetchAllCandlestickData();

      // 3. 启动实时更新
      this.startRealTimeUpdates();

      // 4. 尝试建立WebSocket连接获取实时数据
      this.connectToWebSocket();

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log("✅ 增强版真实市场数据服务连接成功");
      return true;
    } catch (error) {
      console.error("❌ 增强版真实市场数据服务连接失败:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isConnected = false;

    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }

    if (this.candleUpdateInterval) {
      clearInterval(this.candleUpdateInterval);
      this.candleUpdateInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log("📴 已断开增强版真实市场数据服务");
  }

  /**
   * 订阅数据流
   */
  subscribe(channel: string, callback: (data: any) => void): void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);
  }

  /**
   * 取消订阅数据流
   */
  unsubscribe(channel: string, callback: (data: any) => void): void {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.delete(callback);
      if (channelSubscribers.size === 0) {
        this.subscribers.delete(channel);
      }
    }
  }

  /**
   * 获取当前价格数据
   */
  getPriceData(): PriceData[] {
    return Array.from(this.priceDataCache.values());
  }

  /**
   * 获取交易对列表
   */
  getTradingPairs() {
    return this.tradingPairs.map((pair) => ({
      symbol: pair.symbol,
      baseAsset: pair.baseAsset,
      quoteAsset: pair.quoteAsset,
    }));
  }

  /**
   * 检查是否已连接到市场
   */
  isConnectedToMarket(): boolean {
    return this.isConnected;
  }

  /**
   * 获取真实的K线数据（使用多数据源服务）
   */
  async generateHistoricalCandles(
    symbol: string,
    interval: string = "1h",
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      console.log(`📈 获取 ${symbol} 真实K线数据...`);

      // 使用专门的K线数据服务
      const candles = await realKlineDataService.fetchKlineData(
        symbol,
        interval,
        limit
      );

      if (candles.length > 0) {
        this.candleDataCache.set(symbol, candles);
        console.log(`✅ 成功获取 ${candles.length} 根K线数据`);
        return candles;
      }

      // 如果所有数据源都失败，返回缓存的数据
      console.warn(`⚠️ 无法获取新数据，返回缓存数据`);
      return this.candleDataCache.get(symbol) || [];
    } catch (error) {
      console.error(`❌ 获取K线数据失败 (${symbol}):`, error);
      return this.candleDataCache.get(symbol) || [];
    }
  }

  /**
   * 获取真实订单簿数据
   */
  async fetchOrderBook(
    symbol: string,
    limit: number = 20
  ): Promise<OrderBook | null> {
    try {
      // 尝试从Binance获取真实订单簿
      const binanceOrderBook = await this.fetchBinanceOrderBook(symbol, limit);
      if (binanceOrderBook) {
        this.orderBookCache.set(symbol, binanceOrderBook);
        this.notifySubscribers("orderbook", binanceOrderBook);
        return binanceOrderBook;
      }

      // 备用：基于当前价格生成订单簿
      return await this.generateOrderBookFromPrice(symbol, limit);
    } catch (error) {
      console.error(`❌ 获取订单簿失败 (${symbol}):`, error);
      return this.orderBookCache.get(symbol) || null;
    }
  }

  /**
   * 获取缓存的订单簿数据
   */
  getCachedOrderBook(symbol: string): OrderBook | null {
    return this.orderBookCache.get(symbol) || null;
  }

  // ==================== 私有方法 ====================

  /**
   * 获取真实价格数据（使用CoinGecko API）
   */
  private async fetchRealPriceData(): Promise<void> {
    try {
      // 防止过于频繁的请求
      const now = Date.now();
      if (now - this.lastUpdateTime < 10000) {
        return;
      }
      this.lastUpdateTime = now;

      const coinIds = this.tradingPairs
        .map((pair) => pair.coinGeckoId)
        .join(",");
      const url = `${this.COINGECKO_BASE}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`;

      console.log("📊 获取真实价格数据...");
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      // 转换并缓存价格数据
      this.tradingPairs.forEach((pair) => {
        const coinData = data[pair.coinGeckoId];
        if (coinData) {
          const priceData: PriceData = {
            symbol: pair.symbol,
            price: coinData.usd || 0,
            priceChange: coinData.usd_24h_change
              ? (coinData.usd * coinData.usd_24h_change) / 100
              : 0,
            priceChangePercent: coinData.usd_24h_change || 0,
            high24h:
              coinData.usd * (1 + Math.abs(coinData.usd_24h_change || 0) / 200), // 估算最高价
            low24h:
              coinData.usd * (1 - Math.abs(coinData.usd_24h_change || 0) / 200), // 估算最低价
            volume24h: coinData.usd_24h_vol || 0,
            timestamp: coinData.last_updated_at
              ? coinData.last_updated_at * 1000
              : Date.now(),
          };

          this.priceDataCache.set(pair.symbol, priceData);
          this.notifySubscribers("price", priceData);
        }
      });

      console.log(
        `✅ 已更新 ${this.tradingPairs.length} 个交易对的真实价格数据`
      );
    } catch (error) {
      console.error("❌ 获取真实价格数据失败:", error);
      throw error;
    }
  }

  /**
   * 从Binance API获取真实K线数据
   */
  private async fetchBinanceKlines(
    symbol: string,
    interval: string = "1h",
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      // 将间隔转换为Binance格式
      const binanceInterval = this.convertToBinanceInterval(interval);
      const url = `${this.BINANCE_BASE}/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;

      console.log(`📊 从Binance获取K线数据: ${symbol}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();

      return data.map((kline: any[]) => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      }));
    } catch (error) {
      console.warn(`⚠️ Binance K线数据获取失败 (${symbol}):`, error);
      return [];
    }
  }

  /**
   * 从CoinGecko获取历史价格数据并构造K线
   */
  private async fetchCoinGeckoKlines(
    symbol: string,
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      const pair = this.tradingPairs.find((p) => p.symbol === symbol);
      if (!pair) return [];

      const days = Math.min(Math.ceil(limit / 24), 30);
      const url = `${this.COINGECKO_BASE}/coins/${pair.coinGeckoId}/market_chart?vs_currency=usd&days=${days}&interval=hourly`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const prices = data.prices || [];
      const volumes = data.total_volumes || [];

      const candles: CandlestickData[] = [];
      const startIndex = Math.max(0, prices.length - limit);

      for (let i = startIndex; i < prices.length; i++) {
        const price = prices[i][1];
        const volume = volumes[i] ? volumes[i][1] : 0;
        const prevPrice = i > 0 ? prices[i - 1][1] : price;

        // 基于价格变化模拟OHLC
        const volatility = 0.01; // 1% 波动率
        const change = (price - prevPrice) / prevPrice;
        const high = price * (1 + Math.abs(change) * volatility);
        const low = price * (1 - Math.abs(change) * volatility);

        candles.push({
          timestamp: prices[i][0],
          open: Number(prevPrice.toFixed(6)),
          high: Number(Math.max(price, high).toFixed(6)),
          low: Number(Math.min(price, low).toFixed(6)),
          close: Number(price.toFixed(6)),
          volume: Number(volume.toFixed(2)),
        });
      }

      return candles;
    } catch (error) {
      console.warn(`⚠️ CoinGecko K线数据获取失败 (${symbol}):`, error);
      return [];
    }
  }

  /**
   * 从Binance获取真实订单簿
   */
  private async fetchBinanceOrderBook(
    symbol: string,
    limit: number = 20
  ): Promise<OrderBook | null> {
    try {
      const url = `${this.BINANCE_BASE}/depth?symbol=${symbol}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        symbol,
        bids: data.bids.map((bid: string[]) => ({
          price: parseFloat(bid[0]),
          amount: parseFloat(bid[1]),
        })),
        asks: data.asks.map((ask: string[]) => ({
          price: parseFloat(ask[0]),
          amount: parseFloat(ask[1]),
        })),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.warn(`⚠️ Binance订单簿获取失败 (${symbol}):`, error);
      return null;
    }
  }

  /**
   * 基于当前价格生成订单簿
   */
  private async generateOrderBookFromPrice(
    symbol: string,
    limit: number = 20
  ): Promise<OrderBook | null> {
    const priceData = this.priceDataCache.get(symbol);
    if (!priceData) return null;

    const currentPrice = priceData.price;
    const spread = currentPrice * 0.001; // 0.1% 价差

    const bids = Array.from({ length: limit }, (_, i) => ({
      price: Number((currentPrice - spread * (i + 1)).toFixed(6)),
      amount: Number((Math.random() * 10 + 0.1).toFixed(4)),
    }));

    const asks = Array.from({ length: limit }, (_, i) => ({
      price: Number((currentPrice + spread * (i + 1)).toFixed(6)),
      amount: Number((Math.random() * 10 + 0.1).toFixed(4)),
    }));

    return {
      symbol,
      bids,
      asks,
      timestamp: Date.now(),
    };
  }

  /**
   * 启动实时更新
   */
  private startRealTimeUpdates(): void {
    // 每30秒更新价格数据
    this.priceUpdateInterval = setInterval(async () => {
      if (this.isConnected) {
        try {
          await this.fetchRealPriceData();
        } catch (error) {
          console.error("❌ 定期更新价格数据失败:", error);
          this.attemptReconnect();
        }
      }
    }, 30000);

    // 每5分钟更新K线数据
    this.candleUpdateInterval = setInterval(async () => {
      if (this.isConnected) {
        await this.fetchAllCandlestickData();
      }
    }, 300000);
  }

  /**
   * 获取所有交易对的K线数据
   */
  private async fetchAllCandlestickData(): Promise<void> {
    const promises = this.tradingPairs.map(async (pair) => {
      try {
        const candles = await this.generateHistoricalCandles(pair.symbol);
        if (candles.length > 0) {
          // 通知新的K线数据
          const latestCandle = candles[candles.length - 1];
          this.notifySubscribers("candle", {
            symbol: pair.symbol,
            data: latestCandle,
          });
        }
      } catch (error) {
        console.error(`获取 ${pair.symbol} K线数据失败:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * 连接到WebSocket获取实时数据
   */
  private connectToWebSocket(): void {
    try {
      // 构建WebSocket流
      const streams = this.tradingPairs
        .map((pair) => `${pair.symbol.toLowerCase()}@ticker`)
        .join("/");

      const wsUrl = `${this.BINANCE_WS}/${streams}`;

      console.log("🔗 连接WebSocket实时数据流...");
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("✅ WebSocket连接成功");
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.s && data.c) {
            // 更新实时价格
            const symbol = data.s;
            const price = parseFloat(data.c);
            const change = parseFloat(data.P);
            const volume = parseFloat(data.v);

            const priceData: PriceData = {
              symbol,
              price,
              priceChange: (price * change) / 100,
              priceChangePercent: change,
              high24h: parseFloat(data.h),
              low24h: parseFloat(data.l),
              volume24h: volume,
              timestamp: Date.now(),
            };

            this.priceDataCache.set(symbol, priceData);
            this.notifySubscribers("price", priceData);
          }
        } catch (error) {
          console.error("WebSocket消息处理失败:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("❌ WebSocket错误:", error);
      };

      this.ws.onclose = () => {
        console.log("📴 WebSocket连接关闭");
        // 5分钟后尝试重连
        setTimeout(() => {
          if (this.isConnected) {
            this.connectToWebSocket();
          }
        }, 300000);
      };
    } catch (error) {
      console.error("WebSocket连接失败:", error);
    }
  }

  /**
   * 转换时间间隔格式
   */
  private convertToBinanceInterval(interval: string): string {
    const intervalMap: { [key: string]: string } = {
      "1m": "1m",
      "5m": "5m",
      "15m": "15m",
      "30m": "30m",
      "1h": "1h",
      "4h": "4h",
      "1d": "1d",
    };
    return intervalMap[interval] || "1h";
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(channel: string, data: any): void {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`通知订阅者失败 (${channel}):`, error);
        }
      });
    }
  }

  /**
   * 尝试重新连接
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ 达到最大重连次数，停止重连");
      this.isConnected = false;
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    try {
      await this.fetchRealPriceData();
      this.reconnectAttempts = 0;
      console.log("✅ 重连成功");
    } catch (error) {
      console.error("❌ 重连失败:", error);
      setTimeout(() => {
        this.attemptReconnect();
      }, 30000);
    }
  }
}

// 单例实例
export const enhancedRealMarketDataService =
  new EnhancedRealMarketDataService();
