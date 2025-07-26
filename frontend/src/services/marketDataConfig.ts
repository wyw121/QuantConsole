/**
 * 市场数据配置
 * 用于控制使用模拟数据还是真实数据
 */

export interface MarketDataConfig {
  // 数据源类型
  dataSource: "mock" | "real" | "coingecko" | "binance";

  // 是否启用实时数据
  enableRealTimeData: boolean;

  // 是否启用订单簿数据
  enableOrderBookData: boolean;

  // 是否启用K线数据
  enableCandlestickData: boolean;

  // 数据更新间隔 (毫秒)
  updateInterval: {
    price: number; // 价格数据更新间隔
    orderbook: number; // 订单簿更新间隔
    candle: number; // K线数据更新间隔
  };

  // 支持的交易对
  supportedSymbols: string[];

  // 开发模式设置
  development: {
    enableLogs: boolean;
    mockDelay: number; // 模拟数据延迟
  };
}

/**
 * 默认配置
 */
export const defaultMarketDataConfig: MarketDataConfig = {
  // 默认使用 CoinGecko 数据源
  dataSource: "coingecko",

  enableRealTimeData: true,
  enableOrderBookData: true,
  enableCandlestickData: true,

  updateInterval: {
    price: 1000, // 价格数据每秒更新
    orderbook: 2000, // 订单簿每2秒更新
    candle: 5000, // K线数据每5秒更新
  },

  supportedSymbols: [
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "ADAUSDT",
    "SOLUSDT",
    "XRPUSDT",
    "DOTUSDT",
    "DOGEUSDT",
    "AVAXUSDT",
    "LINKUSDT",
  ],

  development: {
    enableLogs: process.env.NODE_ENV === "development",
    mockDelay: 100,
  },
};

/**
 * 获取当前配置
 */
export const getMarketDataConfig = (): MarketDataConfig => {
  // 强制使用 CoinGecko 数据源
  console.log("🔧 强制使用 CoinGecko 数据源");
  return { ...defaultMarketDataConfig, dataSource: "coingecko" };

  // 注释掉原来的localStorage逻辑，确保使用真实数据
  /*
  const savedConfig = localStorage.getItem("marketDataConfig");

  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig);
      return { ...defaultMarketDataConfig, ...parsedConfig };
    } catch (error) {
      console.warn("❌ 解析保存的配置失败，使用默认配置");
    }
  }

  return defaultMarketDataConfig;
  */
};

/**
 * 保存配置
 */
export const saveMarketDataConfig = (
  config: Partial<MarketDataConfig>
): void => {
  const currentConfig = getMarketDataConfig();
  const newConfig = { ...currentConfig, ...config };

  localStorage.setItem("marketDataConfig", JSON.stringify(newConfig));
  console.log("✅ 市场数据配置已保存");
};

/**
 * 重置为默认配置
 */
export const resetMarketDataConfig = (): void => {
  localStorage.removeItem("marketDataConfig");
  console.log("🔄 已重置为默认市场数据配置");
};
