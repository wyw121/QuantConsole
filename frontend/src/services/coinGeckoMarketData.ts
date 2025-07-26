import { CandlestickData, OrderBook, PriceData } from "@/types/trading";

/**
 * CoinGecko API 真实市场数据服务
 * 使用 CoinGecko 提供的免费API获取加密货币数据
 */
class CoinGeckoMarketDataService {
  private isConnected = false;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // CoinGecko API 基础 URL
  private readonly COINGECKO_API_BASE = "https://api.coingecko.com/api/v3/";

  // 支持的交易对映射 (CoinGecko ID -> 交易对符号) - 暂时保留以备未来使用
  /* private coinMapping = {
    'bitcoin': 'BTCUSDT',
    'ethereum': 'ETHUSDT',
    'binancecoin': 'BNBUSDT',
    'cardano': 'ADAUSDT',
    'solana': 'SOLUSDT',
    'ripple': 'XRPUSDT',
    'polkadot': 'DOTUSDT',
    'dogecoin': 'DOGEUSDT',
    'avalanche-2': 'AVAXUSDT',
    'chainlink': 'LINKUSDT'
  }; */

  // 交易对信息
  private tradingPairs = [
    {
      symbol: "BTCUSDT",
      baseAsset: "BTC",
      quoteAsset: "USDT",
      coinId: "bitcoin",
    },
    {
      symbol: "ETHUSDT",
      baseAsset: "ETH",
      quoteAsset: "USDT",
      coinId: "ethereum",
    },
    {
      symbol: "BNBUSDT",
      baseAsset: "BNB",
      quoteAsset: "USDT",
      coinId: "binancecoin",
    },
    {
      symbol: "ADAUSDT",
      baseAsset: "ADA",
      quoteAsset: "USDT",
      coinId: "cardano",
    },
    {
      symbol: "SOLUSDT",
      baseAsset: "SOL",
      quoteAsset: "USDT",
      coinId: "solana",
    },
    {
      symbol: "XRPUSDT",
      baseAsset: "XRP",
      quoteAsset: "USDT",
      coinId: "ripple",
    },
    {
      symbol: "DOTUSDT",
      baseAsset: "DOT",
      quoteAsset: "USDT",
      coinId: "polkadot",
    },
    {
      symbol: "DOGEUSDT",
      baseAsset: "DOGE",
      quoteAsset: "USDT",
      coinId: "dogecoin",
    },
    {
      symbol: "AVAXUSDT",
      baseAsset: "AVAX",
      quoteAsset: "USDT",
      coinId: "avalanche-2",
    },
    {
      symbol: "LINKUSDT",
      baseAsset: "LINK",
      quoteAsset: "USDT",
      coinId: "chainlink",
    },
  ];

  // 缓存的价格数据
  private priceDataCache: Map<string, PriceData> = new Map();
  private orderBookCache: Map<string, OrderBook> = new Map();
  private lastUpdateTime = 0;

  /**
   * 连接到 CoinGecko API
   */
  async connect(): Promise<boolean> {
    try {
      console.log("🔗 连接到 CoinGecko API...");

      // 获取初始价格数据
      await this.fetchPriceData();

      // 开始定期更新价格数据
      this.startPriceUpdates();

      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log("✅ CoinGecko API 连接成功");
      return true;
    } catch (error) {
      console.error("❌ CoinGecko API 连接失败:", error);
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

    console.log("📴 已断开 CoinGecko API 连接");
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
   * 获取历史K线数据
   */
  async generateHistoricalCandles(
    symbol: string,
    _interval: string = "1h", // 添加下划线表示未使用
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      const pair = this.tradingPairs.find((p) => p.symbol === symbol);
      if (!pair) {
        console.warn(`❌ 不支持的交易对: ${symbol}`);
        return [];
      }

      // 计算需要获取的天数
      const days = Math.min(Math.ceil(limit / 24), 30); // CoinGecko 免费版最多30天

      console.log(`📈 获取 ${symbol} 的历史数据 (${days}天)...`);

      const url = `${this.COINGECKO_API_BASE}coins/${pair.coinId}/market_chart?vs_currency=usd&days=${days}&interval=hourly`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 转换为 CandlestickData 格式
      const candles: CandlestickData[] = [];
      const prices = data.prices || [];
      const volumes = data.total_volumes || [];

      // 取最后 limit 个数据点
      const startIndex = Math.max(0, prices.length - limit);

      for (let i = startIndex; i < prices.length; i++) {
        const price = prices[i][1];
        const volume = volumes[i] ? volumes[i][1] : 0;

        // 模拟 OHLC 数据 (CoinGecko 只提供价格点)
        const volatility = 0.005; // 0.5% 波动率
        const high = price * (1 + Math.random() * volatility);
        const low = price * (1 - Math.random() * volatility);
        const open = i > 0 ? prices[i - 1][1] : price;

        candles.push({
          timestamp: prices[i][0],
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(price.toFixed(2)),
          volume: Number(volume.toFixed(2)),
        });
      }

      console.log(`✅ 获取到 ${candles.length} 根K线数据`);
      return candles;
    } catch (error) {
      console.error(`❌ 获取历史K线数据失败 (${symbol}):`, error);
      return [];
    }
  }

  /**
   * 生成模拟订单簿数据
   */
  async fetchOrderBook(
    symbol: string,
    limit: number = 20
  ): Promise<OrderBook | null> {
    try {
      const priceData = this.priceDataCache.get(symbol);
      if (!priceData) {
        return null;
      }

      const currentPrice = priceData.price;

      // 生成模拟订单簿数据
      const bids = Array.from({ length: limit }, (_, i) => ({
        price: currentPrice * (1 - (i + 1) * 0.001),
        amount: Math.random() * 10 + 1,
      }));

      const asks = Array.from({ length: limit }, (_, i) => ({
        price: currentPrice * (1 + (i + 1) * 0.001),
        amount: Math.random() * 10 + 1,
      }));

      const orderBook: OrderBook = {
        symbol,
        bids,
        asks,
        timestamp: Date.now(),
      };

      this.orderBookCache.set(symbol, orderBook);
      this.notifySubscribers("orderbook", orderBook);

      return orderBook;
    } catch (error) {
      console.error(`❌ 生成订单簿数据失败 (${symbol}):`, error);
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
   * 获取价格数据
   */
  private async fetchPriceData(): Promise<void> {
    try {
      // 防止过于频繁的请求
      const now = Date.now();
      if (now - this.lastUpdateTime < 5000) {
        // 5秒内不重复请求
        return;
      }
      this.lastUpdateTime = now;

      const coinIds = this.tradingPairs.map((pair) => pair.coinId).join(",");
      const url = `${this.COINGECKO_API_BASE}simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;

      console.log("📊 获取价格数据...", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 转换并缓存价格数据
      this.tradingPairs.forEach((pair) => {
        const coinData = data[pair.coinId];
        if (coinData) {
          const priceData: PriceData = {
            symbol: pair.symbol,
            price: coinData.usd,
            priceChange: coinData.usd_24h_change
              ? (coinData.usd * coinData.usd_24h_change) / 100
              : 0,
            priceChangePercent: coinData.usd_24h_change || 0,
            high24h: coinData.usd * 1.05, // 模拟24h最高价
            low24h: coinData.usd * 0.95, // 模拟24h最低价
            volume24h: coinData.usd_24h_vol || 0,
            timestamp: Date.now(),
          };

          this.priceDataCache.set(pair.symbol, priceData);
          this.notifySubscribers("price", priceData);
        }
      });

      console.log(`✅ 已更新 ${this.tradingPairs.length} 个交易对的价格数据`);
    } catch (error) {
      console.error("❌ 获取价格数据失败:", error);
      throw error;
    }
  }

  /**
   * 开始定期更新价格数据
   */
  private startPriceUpdates(): void {
    // 每30秒更新一次价格数据 (CoinGecko 免费版有限制)
    this.priceUpdateInterval = setInterval(async () => {
      if (this.isConnected) {
        try {
          await this.fetchPriceData();
        } catch (error) {
          console.error("❌ 定期更新价格数据失败:", error);
          this.attemptReconnect();
        }
      }
    }, 30000);
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
      `🔄 尝试重连 CoinGecko API (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    try {
      await this.fetchPriceData();
      this.reconnectAttempts = 0;
      console.log("✅ CoinGecko API 重连成功");
    } catch (error) {
      console.error("❌ CoinGecko API 重连失败:", error);

      // 延迟后再次尝试
      setTimeout(() => {
        this.attemptReconnect();
      }, 10000); // 10秒后重试
    }
  }
}

// 单例实例
export const coinGeckoMarketDataService = new CoinGeckoMarketDataService();
