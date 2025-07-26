import { Button } from "@/components/Button";
import { coinGeckoMarketDataService } from "@/services/coinGeckoMarketData";
import { okxMarketDataService } from "@/services/okxMarketData";
import { realMarketDataService } from "@/services/realMarketData";
import { smartDataAggregator } from "@/services/smartDataAggregator";
import { PriceData } from "@/types/trading";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  DollarSign,
  Eye,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import React, { useEffect, useState } from "react";

console.log("🔍 [DEBUG] ExchangeDataComparison.tsx 文件正在加载...");

interface DataComparison {
  symbol: string;
  binanceData?: PriceData;
  coinGeckoData?: PriceData;
  okxData?: PriceData;
  maxPriceDifference: number;
  percentageDifference: number;
  timeDifference: number;
  riskLevel: "low" | "medium" | "high";
  dataQuality: number;
}

interface ConnectionStatus {
  binance: boolean;
  coinGecko: boolean;
  okx: boolean;
  aggregator: boolean;
}

interface Statistics {
  totalComparisons: number;
  averageDeviation: number;
  maxDeviation: number;
  highRiskCount: number;
  averageQuality: number;
  lastUpdate: string;
}

/**
 * 交易所数据差异监控工具
 * 实时比较不同数据源的价格差异，支持Binance、OKX、CoinGecko多数据源
 */
const ExchangeDataComparison: React.FC = () => {
  console.log("🔍 [DEBUG] ExchangeDataComparison 组件正在渲染...");

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [comparisons, setComparisons] = useState<DataComparison[]>([]);
  const [monitoringInterval, setMonitoringInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    binance: false,
    coinGecko: false,
    okx: false,
    aggregator: false,
  });

  // 配置参数
  const [config, setConfig] = useState({
    updateInterval: 10000, // 10秒更新一次
    priceDeviationThreshold: 0.1, // 0.1% 价格偏差警报阈值
    maxTimeDifference: 30000, // 30秒时间差警报阈值
  });

  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  // 数据分析函数
  const performDataAnalysis = (
    binanceData: PriceData[],
    coinGeckoData: PriceData[],
    okxData: PriceData[]
  ): DataComparison[] => {
    console.log("🔍 [DEBUG] 开始数据分析...", {
      binanceData: binanceData.length,
      coinGeckoData: coinGeckoData.length,
      okxData: okxData.length,
    });

    const comparisons: DataComparison[] = [];

    // 获取所有唯一的交易对
    const allSymbols = new Set([
      ...binanceData.map((d) => d.symbol),
      ...coinGeckoData.map((d) => d.symbol.replace("-", "")),
      ...okxData.map((d) => d.symbol.replace("-", "")),
    ]);

    console.log("🔍 [DEBUG] 发现交易对:", Array.from(allSymbols));

    allSymbols.forEach((symbol) => {
      const binancePrice = binanceData.find((d) => d.symbol === symbol);
      const coinGeckoPrice = coinGeckoData.find(
        (d) => d.symbol.replace("-", "") === symbol
      );
      const okxPrice = okxData.find(
        (d) => d.symbol.replace("-", "") === symbol
      );

      if (binancePrice || coinGeckoPrice || okxPrice) {
        const prices = [
          binancePrice?.price,
          coinGeckoPrice?.price,
          okxPrice?.price,
        ].filter((p) => p !== undefined) as number[];

        if (prices.length >= 2) {
          const maxPrice = Math.max(...prices);
          const minPrice = Math.min(...prices);
          const priceDiff = maxPrice - minPrice;
          const percentageDiff = (priceDiff / minPrice) * 100;

          // 计算时间差
          const timestamps = [
            binancePrice?.timestamp,
            coinGeckoPrice?.timestamp,
            okxPrice?.timestamp,
          ].filter((t) => t !== undefined) as number[];

          const timeDiff =
            timestamps.length > 1
              ? Math.max(...timestamps) - Math.min(...timestamps)
              : 0;

          // 评估风险等级
          let riskLevel: "low" | "medium" | "high" = "low";
          if (percentageDiff > 1.0) riskLevel = "high";
          else if (percentageDiff > 0.5) riskLevel = "medium";

          // 计算数据质量
          const dataQuality = Math.max(
            0,
            100 - percentageDiff * 10 - timeDiff / 1000
          );

          comparisons.push({
            symbol,
            binanceData: binancePrice,
            coinGeckoData: coinGeckoPrice,
            okxData: okxPrice,
            maxPriceDifference: priceDiff,
            percentageDifference: percentageDiff,
            timeDifference: timeDiff,
            riskLevel,
            dataQuality,
          });

          // 生成警报
          if (percentageDiff > config.priceDeviationThreshold) {
            setAlerts((prev) => [
              ...prev,
              `⚠️ ${symbol}: 价格偏差 ${percentageDiff.toFixed(2)}% 超过阈值`,
            ]);
          }
        }
      }
    });

    return comparisons.sort(
      (a, b) => b.percentageDifference - a.percentageDifference
    );
  };

  // 更新统计信息
  const updateStatistics = (comparisons: DataComparison[]) => {
    console.log("🔍 [DEBUG] 更新统计信息...", comparisons.length);

    if (comparisons.length === 0) return;

    const avgDeviation =
      comparisons.reduce((sum, c) => sum + c.percentageDifference, 0) /
      comparisons.length;
    const maxDeviation = Math.max(
      ...comparisons.map((c) => c.percentageDifference)
    );
    const highRiskCount = comparisons.filter(
      (c) => c.riskLevel === "high"
    ).length;
    const avgQuality =
      comparisons.reduce((sum, c) => sum + c.dataQuality, 0) /
      comparisons.length;

    const stats: Statistics = {
      totalComparisons: comparisons.length,
      averageDeviation: avgDeviation,
      maxDeviation: maxDeviation,
      highRiskCount: highRiskCount,
      averageQuality: avgQuality,
      lastUpdate: new Date().toLocaleTimeString(),
    };

    setStatistics(stats);
  };

  // 执行数据比较
  const performComparison = async () => {
    console.log("🔍 [DEBUG] 开始数据比较...");

    try {
      // 获取多源数据
      const binanceData = realMarketDataService.getPriceData();
      const coinGeckoData = coinGeckoMarketDataService.getPriceData();
      const okxData = okxMarketDataService.getPriceData();

      console.log("📊 数据获取完成:", {
        binance: binanceData.length,
        coinGecko: coinGeckoData.length,
        okx: okxData.length,
      });

      // 执行比较分析
      const newComparisons = performDataAnalysis(
        binanceData,
        coinGeckoData,
        okxData
      );
      setComparisons(newComparisons);

      // 更新统计信息
      updateStatistics(newComparisons);

      console.log(
        "✅ 数据比较完成，发现",
        newComparisons.length,
        "个交易对的差异数据"
      );
    } catch (error) {
      console.error("❌ 执行数据比较失败:", error);
      setAlerts((prev) => [
        ...prev,
        `数据比较失败: ${error instanceof Error ? error.message : "未知错误"}`,
      ]);
    }
  };

  // 开始监控
  const startMonitoring = async () => {
    console.log("🔍 [DEBUG] 开始启动监控...");

    setIsMonitoring(true);
    setAlerts([]);

    try {
      // 连接到智能数据聚合器 (会自动连接多个数据源)
      console.log("🔗 连接到智能数据聚合器...");
      const connected = await smartDataAggregator.connectDataSources();

      if (!connected) {
        throw new Error("无法连接到任何数据源");
      }

      // 更新连接状态
      setConnectionStatus({
        binance: realMarketDataService.isConnectedToMarket(),
        coinGecko: coinGeckoMarketDataService.isConnectedToMarket(),
        okx: okxMarketDataService.isConnectedToMarket(),
        aggregator: true,
      });

      // 立即执行一次比较
      await performComparison();

      // 设置定期比较
      const interval = setInterval(async () => {
        await performComparison();
      }, config.updateInterval);

      setMonitoringInterval(interval);
    } catch (error) {
      console.error("❌ 启动监控失败:", error);
      setIsMonitoring(false);
      setAlerts([
        `启动失败: ${error instanceof Error ? error.message : "未知错误"}`,
      ]);
    }
  };

  // 停止监控
  const stopMonitoring = () => {
    console.log("🔍 [DEBUG] 停止监控...");

    setIsMonitoring(false);
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }

    // 断开连接
    realMarketDataService.disconnect();
    coinGeckoMarketDataService.disconnect();
    okxMarketDataService.disconnect();

    setConnectionStatus({
      binance: false,
      coinGecko: false,
      okx: false,
      aggregator: false,
    });

    console.log("📴 监控已停止");
  };

  // 获取风险颜色
  const getRiskColor = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      default:
        return "text-green-500";
    }
  };

  // 获取连接状态图标
  const getConnectionIcon = (connected: boolean) => {
    return connected ? (
      <Wifi className="w-4 h-4 text-green-500" />
    ) : (
      <WifiOff className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="text-blue-400" />
              交易所数据差异监控
            </h1>
            <p className="text-gray-400 mt-2">
              实时监控Binance、OKX、CoinGecko等多个数据源的价格差异
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                isMonitoring
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isMonitoring ? (
                <>
                  <Eye className="w-4 h-4" />
                  停止监控
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  开始监控
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 连接状态面板 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Binance</span>
              {getConnectionIcon(connectionStatus.binance)}
            </div>
            <div className="text-lg font-bold mt-1">
              {connectionStatus.binance ? "已连接" : "未连接"}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">OKX</span>
              {getConnectionIcon(connectionStatus.okx)}
            </div>
            <div className="text-lg font-bold mt-1">
              {connectionStatus.okx ? "已连接" : "未连接"}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">CoinGecko</span>
              {getConnectionIcon(connectionStatus.coinGecko)}
            </div>
            <div className="text-lg font-bold mt-1">
              {connectionStatus.coinGecko ? "已连接" : "未连接"}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">智能聚合器</span>
              {getConnectionIcon(connectionStatus.aggregator)}
            </div>
            <div className="text-lg font-bold mt-1">
              {connectionStatus.aggregator ? "已启动" : "未启动"}
            </div>
          </div>
        </div>

        {/* 统计信息面板 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-400">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">总比较数</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {statistics.totalComparisons}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">平均偏差</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {statistics.averageDeviation.toFixed(3)}%
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">最大偏差</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {statistics.maxDeviation.toFixed(3)}%
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">高风险项</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {statistics.highRiskCount}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">最后更新</span>
              </div>
              <div className="text-lg font-bold mt-1">
                {statistics.lastUpdate}
              </div>
            </div>
          </div>
        )}

        {/* 警报面板 */}
        {alerts.length > 0 && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">警报信息</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alerts.slice(-5).map((alert, index) => (
                <div
                  key={`alert-${Date.now()}-${index}`}
                  className="text-sm text-red-300"
                >
                  {alert}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 数据比较表格 */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">数据源比较</h2>
            <p className="text-gray-400 text-sm">实时价格数据差异分析</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    交易对
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Binance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    OKX
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    CoinGecko
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    最大差异
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    偏差%
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    风险等级
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    数据质量
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {comparisons.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      {isMonitoring
                        ? "正在获取数据..."
                        : '点击"开始监控"获取数据'}
                    </td>
                  </tr>
                ) : (
                  comparisons.map((comparison, index) => (
                    <tr
                      key={`comparison-${comparison.symbol}-${index}`}
                      className="hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {comparison.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {comparison.binanceData ? (
                          <div>
                            <div className="font-medium">
                              ${comparison.binanceData.price.toFixed(4)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(
                                comparison.binanceData.timestamp
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {comparison.okxData ? (
                          <div>
                            <div className="font-medium">
                              ${comparison.okxData.price.toFixed(4)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(
                                comparison.okxData.timestamp
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {comparison.coinGeckoData ? (
                          <div>
                            <div className="font-medium">
                              ${comparison.coinGeckoData.price.toFixed(4)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(
                                comparison.coinGeckoData.timestamp
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />$
                          {comparison.maxPriceDifference.toFixed(4)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={
                            comparison.percentageDifference > 0.5
                              ? "text-red-400"
                              : "text-green-400"
                          }
                        >
                          {comparison.percentageDifference.toFixed(3)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getRiskColor(comparison.riskLevel)}>
                          {comparison.riskLevel.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                comparison.dataQuality > 80
                                  ? "bg-green-500"
                                  : comparison.dataQuality > 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.max(
                                  0,
                                  comparison.dataQuality
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {comparison.dataQuality.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 配置面板 */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">监控配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="updateInterval"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                更新间隔 (毫秒)
              </label>
              <input
                id="updateInterval"
                type="number"
                value={config.updateInterval}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    updateInterval: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                min="5000"
                max="60000"
                step="1000"
              />
            </div>
            <div>
              <label
                htmlFor="priceThreshold"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                价格偏差阈值 (%)
              </label>
              <input
                id="priceThreshold"
                type="number"
                value={config.priceDeviationThreshold}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    priceDeviationThreshold: parseFloat(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                min="0.01"
                max="5.0"
                step="0.01"
              />
            </div>
            <div>
              <label
                htmlFor="timeThreshold"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                时间差阈值 (毫秒)
              </label>
              <input
                id="timeThreshold"
                type="number"
                value={config.maxTimeDifference}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    maxTimeDifference: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                min="10000"
                max="300000"
                step="5000"
              />
            </div>
          </div>
        </div>

        {/* 调试信息 */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">调试信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">监控状态:</span>
              <span
                className={`ml-2 ${
                  isMonitoring ? "text-green-400" : "text-red-400"
                }`}
              >
                {isMonitoring ? "运行中" : "已停止"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">比较数据:</span>
              <span className="ml-2 text-white">
                {comparisons.length} 个交易对
              </span>
            </div>
            <div>
              <span className="text-gray-400">警报数量:</span>
              <span className="ml-2 text-yellow-400">{alerts.length} 个</span>
            </div>
            <div>
              <span className="text-gray-400">连接数量:</span>
              <span className="ml-2 text-blue-400">
                {Object.values(connectionStatus).filter(Boolean).length}/4 个
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

console.log("🔍 [DEBUG] ExchangeDataComparison 组件定义完成，准备导出...");

export default ExchangeDataComparison;

console.log(
  "🔍 [DEBUG] ExchangeDataComparison.tsx 文件加载完成，默认导出已设置"
);
