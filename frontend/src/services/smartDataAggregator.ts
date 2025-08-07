import { PriceData } from "@/types/trading";
import { coinGeckoMarketDataService } from "./coinGeckoMarketData";
import { enhancedRealMarketDataService } from "./enhancedRealMarketData";
import { okxMarketDataService } from "./okxMarketData";
import { realMarketDataService } from "./realMarketData";

/**
 * 数据质量报告接口
 */
interface DataQualityReport {
  source: string;
  symbol: string;
  priceDeviation: number; // 价格偏差百分比
  timestampDifference: number; // 时间戳差异(毫秒)
  dataFreshness: number; // 数据新鲜度(毫秒)
  reliability: number; // 可靠性评分 (0-100)
  lastUpdate: number; // 最后更新时间
}

/**
 * 聚合数据结果接口
 */
interface AggregatedData {
  data: PriceData;
  source: string;
  confidence: number; // 置信度 (0-100)
  qualityScore: number; // 质量评分 (0-100)
  alternatives: Array<{
    source: string;
    data: PriceData;
    deviation: number;
  }>;
}

/**
 * 数据源配置接口
 */
interface DataSourceConfig {
  name: string;
  service: any;
  priority: number; // 优先级 (1-10, 10最高)
  weight: number; // 权重 (0-1)
  maxDeviation: number; // 最大允许偏差百分比
  timeoutMs: number; // 超时时间
  enabled: boolean;
}

/**
 * 智能数据聚合器
 *
 * 功能：
 * 1. 多数据源数据获取和验证
 * 2. 数据质量评估和异常检测
 * 3. 智能数据源选择和切换
 * 4. 数据一致性监控和报警
 */
export class SmartDataAggregator {
  private dataSources: Map<string, DataSourceConfig> = new Map();
  // private qualityReports: Map<string, DataQualityReport[]> = new Map();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // 配置参数
  private config = {
    monitoringIntervalMs: 10000, // 监控间隔
    maxPriceDeviation: 0.5, // 最大价格偏差 0.5%
    maxTimeDeviation: 30000, // 最大时间偏差 30秒
    minDataFreshness: 60000, // 最小数据新鲜度 60秒
    qualityThreshold: 70, // 质量阈值
    redundancyLevel: 2, // 冗余级别 (至少2个数据源确认)
  };

  constructor() {
    this.initializeDataSources();
  }

  /**
   * 初始化数据源配置
   */
  private initializeDataSources(): void {
    // CoinGecko - 稳定可靠，但更新较慢
    this.dataSources.set("coingecko", {
      name: "CoinGecko",
      service: coinGeckoMarketDataService,
      priority: 8,
      weight: 0.3,
      maxDeviation: 0.3,
      timeoutMs: 5000,
      enabled: true,
    });

    // Binance - 实时性好，但可能有网络问题
    this.dataSources.set("binance", {
      name: "Binance",
      service: realMarketDataService,
      priority: 9,
      weight: 0.4,
      maxDeviation: 0.2,
      timeoutMs: 3000,
      enabled: true,
    });

    // OKX - 新增OKX数据源
    this.dataSources.set("okx", {
      name: "OKX",
      service: okxMarketDataService,
      priority: 8,
      weight: 0.3,
      maxDeviation: 0.25,
      timeoutMs: 4000,
      enabled: true,
    });

    // 增强版真实数据 - 主要数据源
    this.dataSources.set("enhanced", {
      name: "Enhanced Real Data",
      service: enhancedRealMarketDataService,
      priority: 10,
      weight: 0.6,
      maxDeviation: 0.05,
      timeoutMs: 1000,
      enabled: true,
    });

    console.log(
      "🔧 数据聚合器初始化完成，配置了",
      this.dataSources.size,
      "个数据源"
    );
  }

  /**
   * 连接所有可用的数据源
   */
  async connectDataSources(): Promise<boolean> {
    console.log("🔗 连接数据源...");
    const connectionResults: Array<{ source: string; connected: boolean }> = [];

    for (const [sourceId, config] of this.dataSources) {
      if (!config.enabled) continue;

      try {
        console.log(`连接到 ${config.name}...`);
        const connected = await Promise.race([
          config.service.connect(),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), config.timeoutMs)
          ),
        ]);

        connectionResults.push({ source: sourceId, connected });
        console.log(
          `${config.name}: ${connected ? "✅ 连接成功" : "❌ 连接失败"}`
        );
      } catch (error) {
        console.error(`${config.name} 连接失败:`, error);
        connectionResults.push({ source: sourceId, connected: false });
      }
    }

    const connectedSources = connectionResults.filter(
      (r) => r.connected
    ).length;
    console.log(
      `📊 数据源连接完成: ${connectedSources}/${connectionResults.length} 个数据源可用`
    );

    return connectedSources > 0;
  }

  /**
   * 断开所有数据源
   */
  disconnectDataSources(): void {
    console.log("📴 断开所有数据源连接...");

    for (const [_, config] of this.dataSources) {
      try {
        config.service.disconnect();
      } catch (error) {
        console.error(`断开 ${config.name} 连接时出错:`, error);
      }
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
  }

  /**
   * 获取智能聚合的价格数据
   */
  async getAggregatedPriceData(symbol: string): Promise<AggregatedData | null> {
    const sourcesData: Array<{
      source: string;
      data: PriceData;
      config: DataSourceConfig;
    }> = [];

    // 从所有可用数据源获取数据
    for (const [sourceId, config] of this.dataSources) {
      if (!config.enabled) continue;

      try {
        const priceData = config.service.getPriceData();
        const symbolData = priceData.find(
          (p: PriceData) => p.symbol === symbol
        );

        if (symbolData) {
          sourcesData.push({ source: sourceId, data: symbolData, config });
        }
      } catch (error) {
        console.error(`从 ${config.name} 获取数据失败:`, error);
      }
    }

    if (sourcesData.length === 0) {
      console.warn(`❌ 没有可用的数据源提供 ${symbol} 的价格数据`);
      return null;
    }

    // 数据质量评估
    const qualityScores = sourcesData.map((sourceData) => {
      const quality = this.evaluateDataQuality(sourceData);
      return { ...sourceData, quality };
    });

    // 选择最优数据源
    const bestSource = qualityScores.reduce((best, current) =>
      current.quality.reliability > best.quality.reliability ? current : best
    );

    // 计算价格偏差
    const alternatives = qualityScores
      .filter((s) => s.source !== bestSource.source)
      .map((s) => ({
        source: s.config.name,
        data: s.data,
        deviation:
          (Math.abs(s.data.price - bestSource.data.price) /
            bestSource.data.price) *
          100,
      }));

    // 检查数据一致性
    const maxDeviation = Math.max(...alternatives.map((alt) => alt.deviation));
    const confidence = Math.max(0, 100 - maxDeviation * 10); // 偏差越大置信度越低

    return {
      data: bestSource.data,
      source: bestSource.config.name,
      confidence,
      qualityScore: bestSource.quality.reliability,
      alternatives,
    };
  }

  /**
   * 评估数据质量
   */
  private evaluateDataQuality(sourceData: {
    source: string;
    data: PriceData;
    config: DataSourceConfig;
  }): DataQualityReport {
    const now = Date.now();
    const dataAge = now - sourceData.data.timestamp;

    // 计算可靠性评分
    let reliability = 100;

    // 数据新鲜度评分 (数据越新越好)
    if (dataAge > this.config.minDataFreshness) {
      reliability -= Math.min(
        30,
        (dataAge - this.config.minDataFreshness) / 1000 / 60
      ); // 每分钟扣1分
    }

    // 数据源优先级评分
    reliability = reliability * (sourceData.config.priority / 10);

    // 价格合理性检查 (暂时跳过，需要参考价格)

    return {
      source: sourceData.source,
      symbol: sourceData.data.symbol,
      priceDeviation: 0, // 需要参考价格计算
      timestampDifference: dataAge,
      dataFreshness: dataAge,
      reliability: Math.max(0, Math.min(100, reliability)),
      lastUpdate: now,
    };
  }

  /**
   * 开始数据质量监控
   */
  startQualityMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log("📊 开始数据质量监控...");

    this.monitoringInterval = setInterval(async () => {
      await this.performQualityCheck();
    }, this.config.monitoringIntervalMs);
  }

  /**
   * 停止数据质量监控
   */
  stopQualityMonitoring(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log("📴 数据质量监控已停止");
  }

  /**
   * 执行质量检查
   */
  private async performQualityCheck(): Promise<void> {
    const commonSymbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT"]; // 检查主要交易对

    for (const symbol of commonSymbols) {
      try {
        const aggregatedData = await this.getAggregatedPriceData(symbol);

        if (aggregatedData) {
          // 检查数据质量是否达标
          if (aggregatedData.qualityScore < this.config.qualityThreshold) {
            console.warn(
              `⚠️ ${symbol} 数据质量较低: ${aggregatedData.qualityScore.toFixed(
                1
              )}/100`
            );
          }

          // 检查价格偏差
          const maxDeviation = Math.max(
            ...aggregatedData.alternatives.map((alt) => alt.deviation)
          );
          if (maxDeviation > this.config.maxPriceDeviation) {
            console.warn(
              `⚠️ ${symbol} 价格偏差过大: ${maxDeviation.toFixed(3)}%`
            );
          }
        }
      } catch (error) {
        console.error(`质量检查失败 (${symbol}):`, error);
      }
    }
  }

  /**
   * 获取数据源状态
   */
  getDataSourceStatus(): Array<{
    name: string;
    enabled: boolean;
    connected: boolean;
    priority: number;
    lastQuality?: number;
  }> {
    const status: Array<any> = [];

    for (const [, config] of this.dataSources) {
      let connected = false;
      try {
        connected = config.service.isConnectedToMarket();
      } catch (error) {
        // 忽略错误，默认为未连接
      }

      status.push({
        name: config.name,
        enabled: config.enabled,
        connected,
        priority: config.priority,
        lastQuality: undefined, // TODO: 从质量报告中获取
      });
    }

    return status;
  }

  /**
   * 启用/禁用数据源
   */
  setDataSourceEnabled(sourceName: string, enabled: boolean): void {
    for (const [, config] of this.dataSources) {
      if (config.name === sourceName) {
        config.enabled = enabled;
        console.log(`${enabled ? "✅ 启用" : "❌ 禁用"} 数据源: ${sourceName}`);
        return;
      }
    }
    console.warn(`❌ 未找到数据源: ${sourceName}`);
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔧 数据聚合器配置已更新:", newConfig);
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return { ...this.config };
  }
}

// 单例实例
export const smartDataAggregator = new SmartDataAggregator();
