import { CandlestickData, OrderBook, PriceData } from "@/types/trading";
import { enhancedRealMarketDataService } from "./enhancedRealMarketData";
import { getMarketDataConfig } from "./marketDataConfig";

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
 * 完全禁用模拟数据，只使用真实的市场数据
 */
class UnifiedMarketDataService implements IMarketDataService {
  private currentService: IMarketDataService;
  private config = getMarketDataConfig();

  constructor() {
    console.log("🔧 初始化统一市场数据服务...");
    console.log("📋 当前配置:", this.config);
    console.log("🚫 模拟数据已完全禁用，强制使用真实数据");
    this.currentService = enhancedRealMarketDataService;
    console.log("📊 使用增强版真实市场数据服务");
    console.log("✅ 统一市场数据服务初始化完成");
  }

  /**
   * 切换数据源 - 现在始终使用真实数据
   */
  async switchDataSource(
    dataSource: "mock" | "real" | "coingecko" | "binance"
  ): Promise<boolean> {
    console.log(`📊 所有数据源都已重定向到真实数据服务`);
    console.log(`📊 用户请求: ${dataSource} -> 实际使用: 增强版真实数据`);

    // 更新配置但始终使用真实数据
    this.config.dataSource = dataSource;
    return true;
  }

  /**
   * 获取当前数据源
   */
  getCurrentDataSource(): "mock" | "real" | "coingecko" | "binance" {
    return this.config.dataSource;
  }

  /**
   * 获取数据源名称
   */
  getDataSourceName(): string {
    return "增强版真实数据";
  }

  /**
   * 检查是否已连接到市场
   */
  isConnectedToMarket(): boolean {
    return this.currentService.isConnectedToMarket();
  }

  /**
   * 连接到市场数据
   */
  async connect(): Promise<boolean> {
    try {
      return await this.currentService.connect();
    } catch (error) {
      console.error("❌ 连接市场数据失败:", error);
      return false;
    }
  }

  /**
   * 断开市场数据连接
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
   * 取消订阅数据流
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
  getTradingPairs() {
    return this.currentService.getTradingPairs();
  }

  /**
   * 生成历史K线数据
   */
  generateHistoricalCandles(
    symbol: string,
    intervalOrCount?: string | number,
    limit?: number
  ): Promise<CandlestickData[]> {
    return this.currentService.generateHistoricalCandles(
      symbol,
      intervalOrCount as string,
      limit
    ) as Promise<CandlestickData[]>;
  }

  /**
   * 获取订单簿数据
   */
  async fetchOrderBook(
    symbol: string,
    limit?: number
  ): Promise<OrderBook | null> {
    if (this.currentService.fetchOrderBook) {
      return await this.currentService.fetchOrderBook(symbol, limit);
    }
    return null;
  }

  /**
   * 获取缓存的订单簿数据
   */
  getCachedOrderBook(symbol: string): OrderBook | null {
    if (this.currentService.getCachedOrderBook) {
      return this.currentService.getCachedOrderBook(symbol);
    }
    return null;
  }
}

// 单例实例
export const marketDataService = new UnifiedMarketDataService();
