import { CandlestickData, OrderBook, PriceData } from "@/types/trading";

/**
 * 后端代理市场数据服务
 * 通过后端API代理获取真实市场数据，支持SSR代理
 */
class BackendProxyMarketDataService {
  private baseURL = "http://localhost:8080/api/market";
  private isConnected = false;
  private priceData: PriceData[] = [];
  private orderBooks = new Map<string, OrderBook>();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    console.log("🚀 初始化后端代理市场数据服务");
  }

  async connect(): Promise<boolean> {
    try {
      console.log("📡 连接到后端代理服务...");

      // 检查后端健康状态
      const healthResponse = await fetch(`${this.baseURL}/health`);
      if (!healthResponse.ok) {
        throw new Error(`后端服务不可用: ${healthResponse.status}`);
      }

      const healthData = await healthResponse.json();
      console.log("✅ 后端代理服务连接成功:", healthData);

      this.isConnected = true;

      // 获取支持的交易对
      await this.loadSupportedSymbols();

      // 开始定期更新数据
      this.startDataUpdates();

      return true;
    } catch (error) {
      console.error("❌ 连接后端代理服务失败:", error);
      this.isConnected = false;
      return false;
    }
  }

  disconnect(): void {
    console.log("🔌 断开后端代理服务连接");
    this.isConnected = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  subscribe(channel: string, _callback: (data: any) => void): void {
    // 前端通过定期更新来模拟实时数据
    console.log(`📺 订阅频道: ${channel}`);
  }

  unsubscribe(channel: string, _callback: (data: any) => void): void {
    console.log(`📺 取消订阅频道: ${channel}`);
  }

  getPriceData(): PriceData[] {
    return this.priceData;
  }

  getTradingPairs(): Array<{
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
  }> {
    return [
      { symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT" },
      { symbol: "ETHUSDT", baseAsset: "ETH", quoteAsset: "USDT" },
      { symbol: "BNBUSDT", baseAsset: "BNB", quoteAsset: "USDT" },
      { symbol: "ADAUSDT", baseAsset: "ADA", quoteAsset: "USDT" },
      { symbol: "SOLUSDT", baseAsset: "SOL", quoteAsset: "USDT" },
    ];
  }

  isConnectedToMarket(): boolean {
    return this.isConnected;
  }

  async generateHistoricalCandles(
    symbol: string,
    intervalOrCount?: string | number,
    limit: number = 100
  ): Promise<CandlestickData[]> {
    try {
      console.log(
        `📊 获取K线数据: ${symbol}, 间隔: ${intervalOrCount}, 数量: ${limit}`
      );

      const interval =
        typeof intervalOrCount === "string" ? intervalOrCount : "1h";
      const actualLimit =
        typeof intervalOrCount === "number" ? intervalOrCount : limit;

      const url = `${this.baseURL}/kline?symbol=${symbol}&interval=${interval}&limit=${actualLimit}`;
      console.log(`🔗 请求URL: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "获取K线数据失败");
      }

      console.log(
        `✅ 成功获取 ${data.data.length} 个K线数据点，数据源: ${data.source}`
      );

      // 转换为前端需要的格式
      const candlesticks: CandlestickData[] = data.data.map((item: any) => ({
        timestamp: item.timestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));

      return candlesticks;
    } catch (error) {
      console.error(`❌ 获取K线数据失败 (${symbol}):`, error);

      // 返回空数组而不是抛出错误，保持界面稳定
      return [];
    }
  }

  async fetchOrderBook(
    symbol: string,
    limit: number = 10
  ): Promise<OrderBook | null> {
    try {
      console.log(`📖 获取订单簿数据: ${symbol}`);

      // 由于我们的后端主要专注于K线数据，这里我们可以基于最新价格生成模拟订单簿
      const klineData = await this.generateHistoricalCandles(symbol, "1m", 1);

      if (klineData.length === 0) {
        console.warn(`⚠️ 无法获取 ${symbol} 的最新价格数据来生成订单簿`);
        return null;
      }

      const latestCandle = klineData[0];
      const basePrice = latestCandle.close;

      // 生成模拟的买卖盘数据
      const asks = [];
      const bids = [];

      for (let i = 1; i <= limit; i++) {
        const askPrice = basePrice * (1 + i * 0.001); // 卖单价格递增
        const bidPrice = basePrice * (1 - i * 0.001); // 买单价格递减
        const volume = Math.random() * 10 + 0.1;

        asks.push({ price: askPrice, amount: volume });
        bids.push({ price: bidPrice, amount: volume });
      }

      const orderBook: OrderBook = {
        symbol,
        asks,
        bids,
        timestamp: Date.now(),
      };

      this.orderBooks.set(symbol, orderBook);
      return orderBook;
    } catch (error) {
      console.error(`❌ 获取订单簿失败 (${symbol}):`, error);
      return null;
    }
  }

  getCachedOrderBook(symbol: string): OrderBook | null {
    return this.orderBooks.get(symbol) || null;
  }

  getCurrentDataSource(): string {
    return "Backend Proxy (Multi-Source)";
  }

  private async loadSupportedSymbols(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/symbols`);
      if (response.ok) {
        const data = await response.json();
        console.log("📋 支持的交易对:", data.symbols);
      }
    } catch (error) {
      console.warn("⚠️ 获取支持的交易对列表失败:", error);
    }
  }

  private startDataUpdates(): void {
    // 每30秒更新一次价格数据
    this.updateInterval = setInterval(async () => {
      await this.updatePriceData();
    }, 30000);

    // 立即执行一次更新
    this.updatePriceData();
  }

  private async updatePriceData(): Promise<void> {
    try {
      console.log("🔄 更新价格数据...");
      const tradingPairs = this.getTradingPairs();
      const newPriceData: PriceData[] = [];

      for (const pair of tradingPairs.slice(0, 5)) {
        // 限制并发请求数量
        try {
          const klineData = await this.generateHistoricalCandles(
            pair.symbol,
            "1m",
            2
          );

          if (klineData.length >= 2) {
            const current = klineData[0];
            const previous = klineData[1];

            const priceChange = current.close - previous.close;
            const priceChangePercent = (priceChange / previous.close) * 100;

            newPriceData.push({
              symbol: pair.symbol,
              price: current.close,
              priceChange: priceChange,
              priceChangePercent: parseFloat(priceChangePercent.toFixed(2)),
              volume24h: current.volume,
              high24h: Math.max(current.high, previous.high),
              low24h: Math.min(current.low, previous.low),
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.warn(`⚠️ 更新 ${pair.symbol} 价格数据失败:`, error);
        }
      }

      if (newPriceData.length > 0) {
        this.priceData = newPriceData;
        console.log(`✅ 成功更新 ${newPriceData.length} 个交易对的价格数据`);
      }
    } catch (error) {
      console.error("❌ 更新价格数据时出错:", error);
    }
  }
}

// 导出单例实例
export const backendProxyMarketDataService =
  new BackendProxyMarketDataService();
