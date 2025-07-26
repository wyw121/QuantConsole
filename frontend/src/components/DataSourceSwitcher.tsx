import { Button } from "@/components/Button";
import {
  getMarketDataConfig,
  saveMarketDataConfig,
} from "@/services/marketDataConfig";
import { marketDataService } from "@/services/unifiedMarketData";
import { Database, Globe, Wifi, WifiOff } from "lucide-react";
import React, { useEffect, useState } from "react";

interface DataSourceSwitcherProps {
  isConnected: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

export const DataSourceSwitcher: React.FC<DataSourceSwitcherProps> = ({
  isConnected,
  onConnectionChange,
}) => {
  const [currentDataSource, setCurrentDataSource] = useState<
    "mock" | "real" | "coingecko" | "binance"
  >("coingecko");
  const [switching, setSwitching] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  useEffect(() => {
    // 获取当前配置
    const config = getMarketDataConfig();
    setCurrentDataSource(config.dataSource);

    // 获取服务状态
    const status = marketDataService.getServiceStatus();
    setServiceStatus(status);
  }, [isConnected]);

  const handleSwitchDataSource = async (
    dataSource: "mock" | "real" | "coingecko" | "binance"
  ) => {
    if (switching || currentDataSource === dataSource) return;

    setSwitching(true);

    try {
      const sourceNames = {
        mock: "模拟",
        real: "真实",
        coingecko: "CoinGecko",
        binance: "Binance",
      };

      console.log(`🔄 切换到 ${sourceNames[dataSource]} 数据源...`);

      // 切换数据源
      const connected = await marketDataService.switchDataSource(dataSource);

      if (connected) {
        setCurrentDataSource(dataSource);

        // 保存配置
        saveMarketDataConfig({ dataSource });

        // 更新服务状态
        const status = marketDataService.getServiceStatus();
        setServiceStatus(status);

        // 通知父组件连接状态变化
        if (onConnectionChange) {
          onConnectionChange(connected);
        }

        console.log(
          `✅ 已成功切换到 ${dataSource === "real" ? "真实" : "模拟"} 数据源`
        );
      } else {
        console.error(
          `❌ 切换到 ${dataSource === "real" ? "真实" : "模拟"} 数据源失败`
        );
      }
    } catch (error) {
      console.error("❌ 切换数据源时发生错误:", error);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-dark-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white flex items-center">
          <Database className="w-5 h-5 mr-2" />
          数据源配置
        </h3>

        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">已连接</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">未连接</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* 数据源选择 */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">选择数据源</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={currentDataSource === "coingecko" ? "primary" : "ghost"}
              className={`w-full justify-start ${
                currentDataSource === "coingecko"
                  ? "bg-green-600 hover:bg-green-700"
                  : "border-gray-600 text-gray-400 hover:bg-gray-700"
              } ${switching ? "opacity-50" : ""}`}
              onClick={() => handleSwitchDataSource("coingecko")}
              disabled={switching}
            >
              <Globe className="w-4 h-4 mr-2" />
              CoinGecko
            </Button>

            <Button
              variant={currentDataSource === "binance" ? "primary" : "ghost"}
              className={`w-full justify-start ${
                currentDataSource === "binance"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "border-gray-600 text-gray-400 hover:bg-gray-700"
              } ${switching ? "opacity-50" : ""}`}
              onClick={() => handleSwitchDataSource("binance")}
              disabled={switching}
            >
              <Globe className="w-4 h-4 mr-2" />
              Binance
            </Button>

            <Button
              variant={currentDataSource === "mock" ? "secondary" : "ghost"}
              className={`w-full justify-start col-span-2 ${
                currentDataSource === "mock"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "border-gray-600 text-gray-400 hover:bg-gray-700"
              } ${switching ? "opacity-50" : ""}`}
              onClick={() => handleSwitchDataSource("mock")}
              disabled={switching}
            >
              <Database className="w-4 h-4 mr-2" />
              模拟数据 (用于测试)
            </Button>
          </div>
        </div>

        {/* 当前状态 */}
        <div className="bg-dark-700 rounded-lg p-3">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">当前数据源:</span>
              <span
                className={`font-medium ${
                  currentDataSource === "coingecko"
                    ? "text-green-400"
                    : currentDataSource === "binance"
                    ? "text-yellow-400"
                    : currentDataSource === "real"
                    ? "text-orange-400"
                    : "text-blue-400"
                }`}
              >
                {currentDataSource === "coingecko"
                  ? "CoinGecko API"
                  : currentDataSource === "binance"
                  ? "Binance API"
                  : currentDataSource === "real"
                  ? "真实数据"
                  : "模拟数据生成器"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">连接状态:</span>
              <span
                className={`font-medium ${
                  isConnected ? "text-green-400" : "text-red-400"
                }`}
              >
                {isConnected ? "已连接" : "未连接"}
              </span>
            </div>

            {serviceStatus && (
              <div className="flex justify-between">
                <span className="text-gray-400">支持的交易对:</span>
                <span className="text-white font-medium">
                  {serviceStatus.supportedSymbols?.length || 0} 个
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 数据源说明 */}
        <div className="text-xs text-gray-400 space-y-1">
          {currentDataSource === "coingecko" ? (
            <>
              <p>• 连接到 CoinGecko 免费 API</p>
              <p>• 提供稳定的加密货币价格数据</p>
              <p>• 30秒更新间隔，支持历史数据</p>
            </>
          ) : currentDataSource === "binance" ? (
            <>
              <p>• 连接到 Binance WebSocket API</p>
              <p>• 提供最快的实时市场数据</p>
              <p>• 包含实时K线图和订单簿信息</p>
            </>
          ) : currentDataSource === "real" ? (
            <>
              <p>• 智能选择最佳数据源</p>
              <p>• 优先使用稳定的API</p>
              <p>• 自动处理网络问题</p>
            </>
          ) : (
            <>
              <p>• 使用算法生成模拟市场数据</p>
              <p>• 基于真实市场波动模式</p>
              <p>• 适用于测试和演示目的</p>
            </>
          )}
        </div>

        {switching && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
            <span className="ml-2 text-sm text-gray-400">切换中...</span>
          </div>
        )}
      </div>
    </div>
  );
};
