import { CandlestickData, OrderBook, PriceData } from "@/types/trading";

/**
 * 真实市场数据服务 - 连接到 Binance Futures WebSocket API
 * 提供实时加密货币永续合约价格、K线图和订单簿数据
 */
class RealMarketDataService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // 多个WebSocket连接点以提高稳定性 - 使用期货 WebSocket
  private readonly WS_ENDPOINTS = [
    "wss://fstream.binance.com/ws/",
    "wss://dstream.binance.com/ws/",
  ];

  // 多个CORS代理以提高成功率
  private readonly CORS_PROXIES = [
    "https://api.allorigins.win/get?url=",
    "https://cors-anywhere.herokuapp.com/",
    "https://api.codetabs.com/v1/proxy?quest=",
  ];

  private readonly BINANCE_DIRECT_API = "https://fapi.binance.com/fapi/v1/";

  private currentWsEndpoint = 0;

  // 支持的永续合约交易对
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

  // 缓存的价格数据
  private priceDataCache: Map<string, PriceData> = new Map();
  private orderBookCache: Map<string, OrderBook> = new Map();

  /**
   * 连接到多个数据源的 WebSocket 实时数据流
   */
  async connect(): Promise<boolean> {
    console.log("🚀 开始连接真实市场数据服务...");

    return new Promise((resolve, reject) => {
      try {
        // 首先获取初始的24h ticker数据
        console.log("📊 获取初始数据...");
        this.fetchInitialData()
          .then(() => {
            console.log("✅ 初始数据获取成功，开始建立WebSocket连接...");

            // 尝试连接WebSocket
            this.connectWebSocket()
              .then(() => {
                resolve(true);
              })
              .catch((error) => {
                console.error("❌ WebSocket连接失败，尝试使用备用方案:", error);
                // 即使WebSocket失败，也可以继续使用HTTP轮询
                resolve(true);
              });
          })
          .catch((error) => {
            console.error("❌ 获取初始数据失败:", error);
            reject(error);
          });
      } catch (error) {
        console.error("❌ 连接失败:", error);
        reject(error);
      }
    });
  }

  /**
   * 尝试建立WebSocket连接
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const tryConnect = (endpointIndex: number = 0) => {
        if (endpointIndex >= this.WS_ENDPOINTS.length) {
          reject(new Error("所有WebSocket端点连接失败"));
          return;
        }

        const endpoint = this.WS_ENDPOINTS[endpointIndex];
        const streams = this.buildWebSocketStreams();
        const wsUrl = `${endpoint}${streams}`;

        console.log(
          `🔗 尝试连接到 WebSocket (端点 ${endpointIndex + 1}/${
            this.WS_ENDPOINTS.length
          })...`,
          wsUrl
        );

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log(`✅ WebSocket 连接成功 (端点 ${endpointIndex + 1})`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.currentWsEndpoint = endpointIndex;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error(
            `❌ WebSocket 错误 (端点 ${endpointIndex + 1}):`,
            error
          );
          this.isConnected = false;
        };

        this.ws.onclose = () => {
          console.log(`📴 WebSocket 连接关闭 (端点 ${endpointIndex + 1})`);
          this.isConnected = false;
          this.stopHeartbeat();

          // 如果是第一次连接失败，尝试下一个端点
          if (
            !this.isConnected &&
            endpointIndex < this.WS_ENDPOINTS.length - 1
          ) {
            tryConnect(endpointIndex + 1);
          } else {
            // 所有端点都尝试过了，开始重连逻辑
            this.attemptReconnect();
          }
        };

        // 设置连接超时
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.log(`⏱️ WebSocket 连接超时，尝试下一个端点...`);
            this.ws.close();
            tryConnect(endpointIndex + 1);
          }
        }, 10000); // 10秒超时
      };

      tryConnect(this.currentWsEndpoint);
    });
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    this.isConnected = false;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log("📴 已断开 Binance WebSocket 连接");
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
   * 检查是否已连接到市场
   */
  isConnectedToMarket(): boolean {
    return this.isConnected;
  }

  /**
   * 获取指定交易对的历史K线数据
   */
  async generateHistoricalCandles(
    symbol: string,
    interval: string = "1m",
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      const directUrl = `${this.BINANCE_DIRECT_API}klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

      // 尝试多个代理
      for (let i = 0; i < this.CORS_PROXIES.length; i++) {
        try {
          const proxyUrl = `${this.CORS_PROXIES[i]}${encodeURIComponent(
            directUrl
          )}`;
          console.log(`🔗 尝试代理 ${i + 1}: ${proxyUrl}`);

          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const proxyData = await response.json();
          const data = this.CORS_PROXIES[i].includes("allorigins")
            ? JSON.parse(proxyData.contents)
            : proxyData;

          return data.map((kline: any[]) => ({
            timestamp: kline[0], // 开盘时间
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5]),
          }));
        } catch (error) {
          console.error(`❌ 代理 ${i + 1} 失败:`, error);
          if (i === this.CORS_PROXIES.length - 1) {
            throw error;
          }
          continue;
        }
      }

      return [];
    } catch (error) {
      console.error(`❌ 获取历史K线数据失败 (${symbol}):`, error);
      return this.generateFallbackCandles(symbol);
    }
  }

  /**
   * 获取指定交易对的订单簿数据
   */
  async fetchOrderBook(
    symbol: string,
    limit: number = 20
  ): Promise<OrderBook | null> {
    try {
      // 尝试多个代理获取订单簿数据
      for (let i = 0; i < this.CORS_PROXIES.length; i++) {
        try {
          const directUrl = `${this.BINANCE_DIRECT_API}depth?symbol=${symbol}&limit=${limit}`;
          const proxyUrl = `${this.CORS_PROXIES[i]}${encodeURIComponent(
            directUrl
          )}`;

          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const proxyData = await response.json();
          const data = this.CORS_PROXIES[i].includes("allorigins")
            ? JSON.parse(proxyData.contents)
            : proxyData;

          const orderBook: OrderBook = {
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

          this.orderBookCache.set(symbol, orderBook);
          this.notifySubscribers("orderbook", orderBook);

          return orderBook;
        } catch (error) {
          console.error(`❌ 代理 ${i + 1} 获取订单簿失败:`, error);
          if (i === this.CORS_PROXIES.length - 1) {
            throw error;
          }
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ 获取订单簿数据失败 (${symbol}):`, error);
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
   * 构建WebSocket流订阅字符串
   */
  private buildWebSocketStreams(): string {
    const streams: string[] = [];

    // 添加24h ticker流（所有交易对的价格数据）
    this.tradingPairs.forEach((pair) => {
      streams.push(`${pair.symbol.toLowerCase()}@ticker`);
    });

    // 添加K线流（1分钟K线）
    this.tradingPairs.forEach((pair) => {
      streams.push(`${pair.symbol.toLowerCase()}@kline_1m`);
    });

    return streams.join("/");
  }

  /**
   * 获取初始的24h ticker数据 - 期货合约
   */
  private async fetchInitialData(): Promise<void> {
    try {
      console.log("📊 获取初始期货合约价格数据...");

      const directUrl = `${this.BINANCE_DIRECT_API}ticker/24hr`;

      // 尝试多个代理获取数据
      for (let i = 0; i < this.CORS_PROXIES.length; i++) {
        try {
          const proxyUrl = `${this.CORS_PROXIES[i]}${encodeURIComponent(
            directUrl
          )}`;
          console.log(`🔗 通过代理 ${i + 1} 访问:`, proxyUrl);

          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const proxyData = await response.json();

          // 解析代理返回的数据
          const data = this.CORS_PROXIES[i].includes("allorigins")
            ? JSON.parse(proxyData.contents)
            : proxyData;

          // 过滤我们关注的交易对
          const relevantTickers = data.filter((ticker: any) =>
            this.tradingPairs.some((pair) => pair.symbol === ticker.symbol)
          );

          // 转换并缓存价格数据
          relevantTickers.forEach((ticker: any) => {
            const priceData: PriceData = {
              symbol: ticker.symbol,
              price: parseFloat(ticker.lastPrice),
              priceChange: parseFloat(ticker.priceChange),
              priceChangePercent: parseFloat(ticker.priceChangePercent),
              high24h: parseFloat(ticker.highPrice),
              low24h: parseFloat(ticker.lowPrice),
              volume24h: parseFloat(ticker.volume),
              timestamp: Date.now(),
            };

            this.priceDataCache.set(ticker.symbol, priceData);
          });

          console.log(
            `✅ 已通过代理 ${i + 1} 获取 ${
              relevantTickers.length
            } 个交易对的初始数据`
          );
          return; // 成功获取数据，退出循环
        } catch (error) {
          console.error(`❌ 代理 ${i + 1} 失败:`, error);
          if (i === this.CORS_PROXIES.length - 1) {
            throw error;
          }
          continue;
        }
      }
    } catch (error) {
      console.error("❌ 获取初始数据失败:", error);
      console.log("🔄 尝试使用模拟数据作为fallback...");

      // 如果API调用失败，使用一些基础的模拟数据作为fallback
      this.setupFallbackData();

      throw error;
    }
  }

  /**
   * 设置fallback数据
   */
  private setupFallbackData(): void {
    console.log("🎭 设置fallback数据...");

    // 使用一些合理的价格数据作为fallback
    const fallbackData = [
      {
        symbol: "BTCUSDT",
        price: 104500,
        priceChange: 2500,
        priceChangePercent: 2.45,
        high24h: 105200,
        low24h: 101800,
        volume24h: 28500000,
      },
      {
        symbol: "ETHUSDT",
        price: 3850,
        priceChange: -120,
        priceChangePercent: -3.02,
        high24h: 3980,
        low24h: 3780,
        volume24h: 15600000,
      },
      {
        symbol: "BNBUSDT",
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
    console.log(`🎭 生成 ${symbol} 的fallback K线数据...`);

    const cachedPrice = this.priceDataCache.get(symbol);
    const basePrice = cachedPrice ? cachedPrice.price : 50000; // 默认价格

    const candles: CandlestickData[] = [];
    const now = Date.now();

    for (let i = 99; i >= 0; i--) {
      const timestamp = now - i * 60 * 1000; // 每分钟一根K线
      const randomFactor = 0.98 + Math.random() * 0.04; // ±2% 随机波动

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
   * 处理WebSocket消息
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // 处理24h ticker数据
      if (data.e === "24hrTicker") {
        this.handleTickerUpdate(data);
      }

      // 处理K线数据
      if (data.e === "kline") {
        this.handleKlineUpdate(data);
      }
    } catch (error) {
      console.error("❌ 处理WebSocket消息失败:", error);
    }
  }

  /**
   * 处理价格ticker更新
   */
  private handleTickerUpdate(data: any): void {
    const priceData: PriceData = {
      symbol: data.s,
      price: parseFloat(data.c),
      priceChange: parseFloat(data.P),
      priceChangePercent: parseFloat(data.P),
      high24h: parseFloat(data.h),
      low24h: parseFloat(data.l),
      volume24h: parseFloat(data.v),
      timestamp: Date.now(),
    };

    this.priceDataCache.set(data.s, priceData);
    this.notifySubscribers("price", priceData);
  }

  /**
   * 处理K线数据更新
   */
  private handleKlineUpdate(data: any): void {
    const kline = data.k;

    const candlestickData: CandlestickData = {
      timestamp: kline.t,
      open: parseFloat(kline.o),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      close: parseFloat(kline.c),
      volume: parseFloat(kline.v),
    };

    this.notifySubscribers("candle", {
      symbol: kline.s,
      data: candlestickData,
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
          console.error(`❌ 通知订阅者失败 (${channel}):`, error);
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
        // Binance WebSocket 不需要显式的心跳，但我们可以检查连接状态
        console.log("💓 WebSocket 连接正常");
      }
    }, 30000); // 每30秒检查一次
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
      console.error("❌ 达到最大重连次数，停止重连");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("❌ 重连失败:", error);
      });
    }, this.reconnectDelay);
  }
}

// 单例实例
export const realMarketDataService = new RealMarketDataService();
