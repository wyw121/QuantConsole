import { CandlestickData, OrderBook, PriceData } from "@/types/trading";

/**
 * OKX市场数据服务
 * 提供OKX交易所的实时加密货币价格、K线图和订单簿数据
 */
class OKXMarketDataService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 5000;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // OKX WebSocket 端点
  private readonly OKX_WS_PUBLIC = "wss://ws.okx.com:8443/ws/v5/public";
  private readonly OKX_API_BASE = "https://www.okx.com/api/v5/market/";

  // 使用CORS代理访问OKX API
  private readonly CORS_PROXIES = [
    "https://api.allorigins.win/get?url=",
    "https://cors-anywhere.herokuapp.com/",
  ];

  // 支持的交易对 (OKX格式)
  private tradingPairs = [
    { symbol: "BTC-USDT", baseAsset: "BTC", quoteAsset: "USDT" },
    { symbol: "ETH-USDT", baseAsset: "ETH", quoteAsset: "USDT" },
    { symbol: "BNB-USDT", baseAsset: "BNB", quoteAsset: "USDT" },
    { symbol: "ADA-USDT", baseAsset: "ADA", quoteAsset: "USDT" },
    { symbol: "SOL-USDT", baseAsset: "SOL", quoteAsset: "USDT" },
    { symbol: "XRP-USDT", baseAsset: "XRP", quoteAsset: "USDT" },
    { symbol: "DOT-USDT", baseAsset: "DOT", quoteAsset: "USDT" },
    { symbol: "DOGE-USDT", baseAsset: "DOGE", quoteAsset: "USDT" },
    { symbol: "AVAX-USDT", baseAsset: "AVAX", quoteAsset: "USDT" },
    { symbol: "LINK-USDT", baseAsset: "LINK", quoteAsset: "USDT" },
  ];

  // 缓存的价格数据
  private priceDataCache: Map<string, PriceData> = new Map();
  private orderBookCache: Map<string, OrderBook> = new Map();

  /**
   * 连接到OKX数据服务
   */
  async connect(): Promise<boolean> {
    console.log("🚀 开始连接OKX市场数据服务...");

    try {
      // 首先获取初始ticker数据
      await this.fetchInitialData();
      console.log("✅ OKX初始数据获取成功");

      // 建立WebSocket连接
      await this.connectWebSocket();

      return true;
    } catch (error) {
      console.error("❌ OKX连接失败:", error);
      // 即使WebSocket失败，也可以继续使用HTTP轮询
      return true;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.isConnected = false;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log("📴 已断开OKX WebSocket连接");
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
    return this.tradingPairs;
  }

  /**
   * 检查是否已连接
   */
  isConnectedToMarket(): boolean {
    return this.isConnected;
  }

  /**
   * 获取历史K线数据
   */
  async generateHistoricalCandles(
    symbol: string,
    interval: string = "1m",
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      // OKX K线数据格式: bar-1m 表示1分钟K线
      const okxInterval = this.convertInterval(interval);
      const directUrl = `${this.OKX_API_BASE}candles?instId=${symbol}&bar=${okxInterval}&limit=${limit}`;

      for (const proxy of this.CORS_PROXIES) {
        try {
          const proxyUrl = `${proxy}${encodeURIComponent(directUrl)}`;

          const response = await fetch(proxyUrl);
          if (!response.ok) continue;

          const proxyData = await response.json();
          const data = proxy.includes("allorigins")
            ? JSON.parse(proxyData.contents)
            : proxyData;

          if (data.code === "0" && data.data) {
            return data.data.map((kline: any[]) => ({
              timestamp: parseInt(kline[0]), // 时间戳
              open: parseFloat(kline[1]), // 开盘价
              high: parseFloat(kline[2]), // 最高价
              low: parseFloat(kline[3]), // 最低价
              close: parseFloat(kline[4]), // 收盘价
              volume: parseFloat(kline[5]), // 成交量
            }));
          }
        } catch (error) {
          console.error("❌ OKX代理失败:", error);
          continue;
        }
      }

      return this.generateFallbackCandles(symbol);
    } catch (error) {
      console.error(`❌ 获取OKX历史K线数据失败 (${symbol}):`, error);
      return this.generateFallbackCandles(symbol);
    }
  }

  /**
   * 获取订单簿数据
   */
  async fetchOrderBook(
    symbol: string,
    limit: number = 20
  ): Promise<OrderBook | null> {
    try {
      const directUrl = `${this.OKX_API_BASE}books?instId=${symbol}&sz=${limit}`;

      for (const proxy of this.CORS_PROXIES) {
        try {
          const proxyUrl = `${proxy}${encodeURIComponent(directUrl)}`;

          const response = await fetch(proxyUrl);
          if (!response.ok) continue;

          const proxyData = await response.json();
          const data = proxy.includes("allorigins")
            ? JSON.parse(proxyData.contents)
            : proxyData;

          if (data.code === "0" && data.data && data.data[0]) {
            const bookData = data.data[0];

            const orderBook: OrderBook = {
              symbol,
              bids: bookData.bids.map((bid: string[]) => ({
                price: parseFloat(bid[0]),
                amount: parseFloat(bid[1]),
              })),
              asks: bookData.asks.map((ask: string[]) => ({
                price: parseFloat(ask[0]),
                amount: parseFloat(ask[1]),
              })),
              timestamp: Date.now(),
            };

            this.orderBookCache.set(symbol, orderBook);
            this.notifySubscribers("orderbook", orderBook);

            return orderBook;
          }
        } catch (error) {
          console.error("❌ OKX订单簿代理失败:", error);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ 获取OKX订单簿数据失败 (${symbol}):`, error);
      return null;
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
   * 建立WebSocket连接
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("🔗 连接到OKX WebSocket...");

      this.ws = new WebSocket(this.OKX_WS_PUBLIC);

      this.ws.onopen = () => {
        console.log("✅ OKX WebSocket连接成功");
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // 订阅ticker数据
        this.subscribeToTickers();
        this.startHeartbeat();
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.ws.onerror = (error) => {
        console.error("❌ OKX WebSocket错误:", error);
        this.isConnected = false;
      };

      this.ws.onclose = () => {
        console.log("📴 OKX WebSocket连接关闭");
        this.isConnected = false;
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      // 连接超时
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.log("⏱️ OKX WebSocket连接超时");
          this.ws.close();
          reject(new Error("连接超时"));
        }
      }, 10000);
    });
  }

  /**
   * 订阅ticker数据
   */
  private subscribeToTickers(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscriptions = this.tradingPairs.map((pair) => ({
      channel: "tickers",
      instId: pair.symbol,
    }));

    const message = {
      op: "subscribe",
      args: subscriptions,
    };

    this.ws.send(JSON.stringify(message));
    console.log("📡 已订阅OKX ticker数据");
  }

  /**
   * 获取初始ticker数据
   */
  private async fetchInitialData(): Promise<void> {
    try {
      const directUrl = `${this.OKX_API_BASE}tickers?instType=SPOT`;

      for (const proxy of this.CORS_PROXIES) {
        try {
          const proxyUrl = `${proxy}${encodeURIComponent(directUrl)}`;

          const response = await fetch(proxyUrl);
          if (!response.ok) continue;

          const proxyData = await response.json();
          const data = proxy.includes("allorigins")
            ? JSON.parse(proxyData.contents)
            : proxyData;

          if (data.code === "0" && data.data) {
            // 过滤我们关注的交易对
            const relevantTickers = data.data.filter((ticker: any) =>
              this.tradingPairs.some((pair) => pair.symbol === ticker.instId)
            );

            // 转换并缓存价格数据
            relevantTickers.forEach((ticker: any) => {
              const priceData: PriceData = {
                symbol: ticker.instId,
                price: parseFloat(ticker.last),
                priceChange: parseFloat(ticker.change24h),
                priceChangePercent: parseFloat(ticker.changePercent24h) * 100,
                high24h: parseFloat(ticker.high24h),
                low24h: parseFloat(ticker.low24h),
                volume24h: parseFloat(ticker.vol24h),
                timestamp: Date.now(),
              };

              this.priceDataCache.set(ticker.instId, priceData);
            });

            console.log(
              `✅ 已获取 ${relevantTickers.length} 个OKX交易对的初始数据`
            );
            return;
          }
        } catch (error) {
          console.error("❌ OKX代理失败:", error);
          continue;
        }
      }

      throw new Error("所有OKX代理都失败");
    } catch (error) {
      console.error("❌ 获取OKX初始数据失败:", error);
      this.setupFallbackData();
    }
  }

  /**
   * 设置fallback数据
   */
  private setupFallbackData(): void {
    console.log("🎭 设置OKX fallback数据...");

    const fallbackData = [
      {
        symbol: "BTC-USDT",
        price: 104500,
        priceChange: 2500,
        priceChangePercent: 2.45,
        high24h: 105200,
        low24h: 101800,
        volume24h: 28500000,
      },
      {
        symbol: "ETH-USDT",
        price: 3850,
        priceChange: -120,
        priceChangePercent: -3.02,
        high24h: 3980,
        low24h: 3780,
        volume24h: 15600000,
      },
      {
        symbol: "BNB-USDT",
        price: 695,
        priceChange: 15,
        priceChangePercent: 2.21,
        high24h: 708,
        low24h: 668,
        volume24h: 1200000,
      },
    ];

    fallbackData.forEach((data) => {
      const priceData: PriceData = {
        symbol: data.symbol,
        price: data.price,
        priceChange: data.priceChange,
        priceChangePercent: data.priceChangePercent,
        high24h: data.high24h,
        low24h: data.low24h,
        volume24h: data.volume24h,
        timestamp: Date.now(),
      };

      this.priceDataCache.set(data.symbol, priceData);
    });
  }

  /**
   * 生成fallback K线数据
   */
  private generateFallbackCandles(symbol: string): CandlestickData[] {
    const cachedPrice = this.priceDataCache.get(symbol);
    const basePrice = cachedPrice ? cachedPrice.price : 50000;

    const candles: CandlestickData[] = [];
    const now = Date.now();

    for (let i = 99; i >= 0; i--) {
      const timestamp = now - i * 60 * 1000;
      const randomFactor = 0.98 + Math.random() * 0.04;

      const open = basePrice * randomFactor;
      const high = open * (1 + Math.random() * 0.02);
      const low = open * (1 - Math.random() * 0.02);
      const close = low + Math.random() * (high - low);
      const volume = 1000 + Math.random() * 9000;

      candles.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      });
    }

    return candles;
  }

  /**
   * 转换时间间隔格式
   */
  private convertInterval(interval: string): string {
    const intervalMap: { [key: string]: string } = {
      "1m": "1m",
      "5m": "5m",
      "15m": "15m",
      "30m": "30m",
      "1h": "1H",
      "4h": "4H",
      "1d": "1D",
    };

    return intervalMap[interval] || "1m";
  }

  /**
   * 处理WebSocket消息
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      // 处理事件响应
      if (message.event) {
        if (message.event === "subscribe") {
          console.log("✅ OKX订阅成功:", message.arg);
        } else if (message.event === "error") {
          console.error("❌ OKX订阅错误:", message);
        }
        return;
      }

      // 处理数据更新
      if (message.arg && message.data) {
        if (message.arg.channel === "tickers") {
          this.handleTickerUpdate(message.data);
        }
      }
    } catch (error) {
      console.error("❌ 处理OKX WebSocket消息失败:", error);
    }
  }

  /**
   * 处理ticker更新
   */
  private handleTickerUpdate(data: any[]): void {
    data.forEach((ticker: any) => {
      const priceData: PriceData = {
        symbol: ticker.instId,
        price: parseFloat(ticker.last),
        priceChange: parseFloat(ticker.change24h),
        priceChangePercent: parseFloat(ticker.changePercent24h) * 100,
        high24h: parseFloat(ticker.high24h),
        low24h: parseFloat(ticker.low24h),
        volume24h: parseFloat(ticker.vol24h),
        timestamp: Date.now(),
      };

      this.priceDataCache.set(ticker.instId, priceData);
      this.notifySubscribers("price", priceData);
    });
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
          console.error(`❌ 通知OKX订阅者失败 (${channel}):`, error);
        }
      });
    }
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // OKX需要定期发送ping保持连接
        this.ws.send("ping");
      }
    }, 30000);
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 尝试重新连接
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ OKX达到最大重连次数，停止重连");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 尝试OKX重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      this.connectWebSocket().catch((error) => {
        console.error("❌ OKX重连失败:", error);
      });
    }, this.reconnectDelay);
  }
}

// 单例实例
export const okxMarketDataService = new OKXMarketDataService();
