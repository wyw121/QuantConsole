import { CandlestickData, OrderBook, PriceData } from "@/types/trading";
import { coinGeckoMarketDataService as coinGeckoService } from "./coinGeckoMarketData";
import { marketDataService as mockService } from "./marketData";
import { getMarketDataConfig } from "./marketDataConfig";
import { realMarketDataService as realService } from "./realMarketData";

/**
 * 市场数据服务接口
 * 定义所有市场数据服务必须实现的方法
 */
interface IMarketDataService {
  connect(): Promise<boolean>;
  disconnect(): void;
  subscribe(channel: string, callback: (data: any) => void): void;
  unsubscribe(channel: string, callback: (data: any) => void): void;
  getPriceData(): PriceData[];
  getTradingPairs(): Array<{
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
  }>;
  isConnectedToMarket(): boolean;
  generateHistoricalCandles(
    symbol: string,
    intervalOrCount?: string | number,
    limit?: number
  ): Promise<CandlestickData[]> | CandlestickData[];
  fetchOrderBook?(symbol: string, limit?: number): Promise<OrderBook | null>;
  getCachedOrderBook?(symbol: string): OrderBook | null;
}

/**
 * 统一的市场数据服务
 * 根据配置自动选择使用模拟数据还是真实数据
 */
class UnifiedMarketDataService implements IMarketDataService {
  private currentService: IMarketDataService;
  private config = getMarketDataConfig();

  constructor() {
    console.log("🔧 初始化统一市场数据服务...");
    console.log("📋 当前配置:", this.config);
    this.currentService = this.createService();
    console.log(
      `📊 使用 ${
        this.config.dataSource === "real" ? "真实" : "模拟"
      } 市场数据服务`
    );
    console.log("✅ 统一市场数据服务初始化完成");
  }

  /**
   * 根据配置创建相应的服务实例
   */
  private createService(): IMarketDataService {
    if (
      this.config.dataSource === "coingecko" ||
      this.config.dataSource === "real"
    ) {
      // 优先使用 CoinGecko 作为真实数据源
      return coinGeckoService;
    } else if (this.config.dataSource === "binance") {
      // 备用：Binance 数据源
      return realService;
    } else {
      return mockService;
    }
  }

  /**
   * 切换数据源
   */
  async switchDataSource(
    dataSource: "mock" | "real" | "coingecko" | "binance"
  ): Promise<boolean> {
    if (this.config.dataSource === dataSource) {
      const sourceNames = {
        mock: "模拟",
        real: "真实",
        coingecko: "CoinGecko",
        binance: "Binance",
      };
      console.log(`📊 当前已经使用 ${sourceNames[dataSource]} 数据服务`);
      return true;
    }

    // 断开当前连接
    this.currentService.disconnect();

    // 更新配置
    this.config.dataSource = dataSource;

    // 创建新的服务实例
    this.currentService = this.createService();

    const sourceNames = {
      mock: "模拟",
      real: "真实",
      coingecko: "CoinGecko",
      binance: "Binance",
    };

    console.log(`🔄 切换到 ${sourceNames[dataSource]} 市场数据服务`);

    // 连接新的服务
    try {
      const connected = await this.currentService.connect();
      if (connected) {
        console.log(`✅ ${sourceNames[dataSource]} 数据服务连接成功`);
      }
      return connected;
    } catch (error) {
      console.error(`❌ ${sourceNames[dataSource]} 数据服务连接失败:`, error);
      return false;
    }
  }

  /**
   * 获取当前数据源类型
   */
  getCurrentDataSource(): "mock" | "real" | "coingecko" | "binance" {
    return this.config.dataSource;
  }

  /**
   * 检查当前服务是否连接
   */
  isConnectedToMarket(): boolean {
    return this.currentService.isConnectedToMarket();
  }

  /**
   * 连接到市场数据服务
   */
  async connect(): Promise<boolean> {
    try {
      return await this.currentService.connect();
    } catch (error) {
      console.error("❌ 连接市场数据服务失败:", error);

      // 如果真实数据服务连接失败，自动回退到模拟数据
      if (this.config.dataSource === "real") {
        console.log("🔄 真实数据连接失败，回退到模拟数据服务...");
        return await this.switchDataSource("mock");
      }

      return false;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.currentService.disconnect();
  }

  /**
   * 订阅数据流
   */
  subscribe(channel: string, callback: (data: any) => void): void {
    this.currentService.subscribe(channel, callback);
  }

  /**
   * 取消订阅
   */
  unsubscribe(channel: string, callback: (data: any) => void): void {
    this.currentService.unsubscribe(channel, callback);
  }

  /**
   * 获取价格数据
   */
  getPriceData(): PriceData[] {
    return this.currentService.getPriceData();
  }

  /**
   * 获取交易对列表
   */
  getTradingPairs(): Array<{
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
  }> {
    return this.currentService.getTradingPairs();
  }

  /**
   * 获取历史K线数据
   */
  async generateHistoricalCandles(
    symbol: string,
    intervalOrCount: string | number = "1m",
    limit: number = 100
  ): Promise<CandlestickData[]> {
    // 如果是真实数据服务，使用interval和limit参数
    if (this.config.dataSource === "real") {
      const interval =
        typeof intervalOrCount === "string" ? intervalOrCount : "1m";
      const result = this.currentService.generateHistoricalCandles(
        symbol,
        interval,
        limit
      );
      return result instanceof Promise ? await result : result;
    } else {
      // 如果是模拟数据服务，使用count参数
      const count =
        typeof intervalOrCount === "number" ? intervalOrCount : limit;
      const result = this.currentService.generateHistoricalCandles(
        symbol,
        count
      );
      return result instanceof Promise ? await result : result;
    }
  }

  /**
   * 获取订单簿数据（如果支持）
   */
  async fetchOrderBook(
    symbol: string,
    limit: number = 20
  ): Promise<OrderBook | null> {
    if (this.currentService.fetchOrderBook) {
      return await this.currentService.fetchOrderBook(symbol, limit);
    }
    return null;
  }

  /**
   * 获取缓存的订单簿数据（如果支持）
   */
  getCachedOrderBook(symbol: string): OrderBook | null {
    if (this.currentService.getCachedOrderBook) {
      return this.currentService.getCachedOrderBook(symbol);
    }
    return null;
  }

  /**
   * 获取服务状态信息
   */
  getServiceStatus() {
    return {
      dataSource: this.config.dataSource,
      isConnected: this.currentService.isConnectedToMarket(),
      supportedSymbols: this.config.supportedSymbols,
      features: {
        realTimeData: this.config.enableRealTimeData,
        orderBookData: this.config.enableOrderBookData,
        candlestickData: this.config.enableCandlestickData,
      },
    };
  }
}

// 导出统一的市场数据服务实例
const marketDataService = new UnifiedMarketDataService();
export { marketDataService, type IMarketDataService };
