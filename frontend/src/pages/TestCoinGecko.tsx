import { Button } from "@/components/Button";
import { coinGeckoMarketDataService } from "@/services/coinGeckoMarketData";
import { CandlestickData, PriceData } from "@/types/trading";
import { Database, LineChart, RefreshCw, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";

/**
 * CoinGecko API 测试页面
 * 用于验证 CoinGecko 数据服务是否正常工作
 */
export const TestCoinGecko: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [candleData, setCandleData] = useState<CandlestickData[]>([]);

  useEffect(() => {
    // 初始化时不自动连接，由用户手动测试
    return () => {
      coinGeckoMarketDataService.disconnect();
    };
  }, []);

  // 测试连接
  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResults([]);

    const results: any[] = [];

    try {
      results.push({
        test: "连接测试",
        status: "进行中",
        message: "正在连接到 CoinGecko API...",
        timestamp: new Date().toLocaleTimeString(),
      });
      setTestResults([...results]);

      // 测试连接
      const connected = await coinGeckoMarketDataService.connect();

      if (connected) {
        results[0] = {
          ...results[0],
          status: "成功",
          message: "✅ CoinGecko API 连接成功",
        };
        setIsConnected(true);
      } else {
        results[0] = {
          ...results[0],
          status: "失败",
          message: "❌ CoinGecko API 连接失败",
        };
      }

      setTestResults([...results]);

      if (connected) {
        // 测试价格数据
        results.push({
          test: "价格数据测试",
          status: "进行中",
          message: "正在获取价格数据...",
          timestamp: new Date().toLocaleTimeString(),
        });
        setTestResults([...results]);

        // 等待一段时间获取数据
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const prices = coinGeckoMarketDataService.getPriceData();
        setPriceData(prices);

        if (prices.length > 0) {
          results[1] = {
            ...results[1],
            status: "成功",
            message: `✅ 获取到 ${prices.length} 个交易对的价格数据`,
          };
        } else {
          results[1] = {
            ...results[1],
            status: "失败",
            message: "❌ 未获取到价格数据",
          };
        }

        setTestResults([...results]);

        // 测试历史K线数据
        results.push({
          test: "K线数据测试",
          status: "进行中",
          message: "正在获取历史K线数据...",
          timestamp: new Date().toLocaleTimeString(),
        });
        setTestResults([...results]);

        const candles =
          await coinGeckoMarketDataService.generateHistoricalCandles(
            "BTCUSDT",
            "1h",
            24
          );
        setCandleData(candles);

        if (candles.length > 0) {
          results[2] = {
            ...results[2],
            status: "成功",
            message: `✅ 获取到 ${candles.length} 根K线数据`,
          };
        } else {
          results[2] = {
            ...results[2],
            status: "失败",
            message: "❌ 未获取到K线数据",
          };
        }

        setTestResults([...results]);
      }
    } catch (error) {
      console.error("测试过程中出现错误:", error);
      results.push({
        test: "错误",
        status: "失败",
        message: `❌ 测试过程中出现错误: ${error}`,
        timestamp: new Date().toLocaleTimeString(),
      });
      setTestResults([...results]);
    } finally {
      setIsLoading(false);
    }
  };

  // 断开连接
  const handleDisconnect = () => {
    coinGeckoMarketDataService.disconnect();
    setIsConnected(false);
    setPriceData([]);
    setCandleData([]);
    setTestResults([]);
  };

  // 刷新数据
  const handleRefreshData = () => {
    const prices = coinGeckoMarketDataService.getPriceData();
    setPriceData(prices);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">CoinGecko API 测试</h1>
          <p className="text-gray-400">验证 CoinGecko 数据服务是否正常工作</p>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={handleTestConnection}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "测试中..." : "开始测试"}
          </Button>

          <Button
            onClick={handleDisconnect}
            disabled={!isConnected}
            variant="ghost"
            className="border-red-600 text-red-400 hover:bg-red-600/10"
          >
            断开连接
          </Button>

          <Button
            onClick={handleRefreshData}
            disabled={!isConnected}
            variant="ghost"
            className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新数据
          </Button>
        </div>

        {/* 连接状态 */}
        <div className="text-center">
          <div
            className={`inline-flex items-center px-4 py-2 rounded-lg ${
              isConnected
                ? "bg-green-600/20 text-green-400"
                : "bg-red-600/20 text-red-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            ></div>
            {isConnected ? "已连接到 CoinGecko API" : "未连接"}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 测试结果 */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              测试结果
            </h3>

            {testResults.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                点击"开始测试"来验证 CoinGecko API 连接
              </p>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="bg-dark-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{result.test}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          result.status === "成功"
                            ? "bg-green-600/20 text-green-400"
                            : result.status === "失败"
                            ? "bg-red-600/20 text-red-400"
                            : "bg-yellow-600/20 text-yellow-400"
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{result.message}</p>
                    {result.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">
                        {result.timestamp}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 价格数据展示 */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              实时价格数据
            </h3>

            {priceData.length === 0 ? (
              <p className="text-gray-400 text-center py-8">暂无价格数据</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {priceData.map((price) => (
                  <div
                    key={price.symbol}
                    className="bg-dark-700 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{price.symbol}</span>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ${price.price.toFixed(2)}
                        </div>
                        <div
                          className={`text-sm ${
                            price.priceChangePercent >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {price.priceChangePercent >= 0 ? "+" : ""}
                          {price.priceChangePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* K线数据展示 */}
        {candleData.length > 0 && (
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <LineChart className="w-5 h-5 mr-2" />
              历史K线数据 (BTCUSDT)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candleData.slice(-6).map((candle, index) => (
                <div key={index} className="bg-dark-700 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">
                    {new Date(candle.timestamp).toLocaleString()}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>开: ${candle.open}</div>
                    <div>高: ${candle.high}</div>
                    <div>低: ${candle.low}</div>
                    <div>收: ${candle.close}</div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    成交量: {candle.volume.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">说明</h3>
          <div className="text-sm text-gray-400 space-y-2">
            <p>• CoinGecko API 是一个免费的加密货币数据提供商</p>
            <p>• 免费版本有频率限制：每分钟最多50次请求</p>
            <p>• 数据更新间隔为30秒，适合实时显示需求</p>
            <p>• 支持价格、24小时变化、市值、交易量等数据</p>
            <p>• 无需API密钥，直接调用公开接口</p>
          </div>
        </div>
      </div>
    </div>
  );
};
