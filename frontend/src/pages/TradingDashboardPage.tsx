import { Button } from "@/components/Button";
import { DataSourceSwitcher } from "@/components/DataSourceSwitcher";
import { MarketStats, MarketStatus } from "@/components/MarketStats";
import { OrderBook } from "@/components/OrderBook";
import { PriceTicker, TopTicker } from "@/components/PriceTicker";
import { QuickTradePanel } from "@/components/QuickTradePanel";
import { RecentTrades } from "@/components/RecentTrades";
import { TradingChart } from "@/components/TradingChart";
import { useAuth, useMarketData, useTradingPairs } from "@/hooks";
import {
  Activity,
  BarChart3,
  BookOpen,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Settings,
  Star,
  Wifi,
  WifiOff,
} from "lucide-react";
import React, { useEffect, useState } from "react";

export const TradingDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    isConnected,
    connectionError,
    priceData,
    selectedSymbol,
    orderBook,
    connect,
    disconnect,
    selectSymbol,
    getCandlesBySymbol,
    getPriceBySymbol,
  } = useMarketData();

  const {
    favorites,
    searchTerm,
    setSearchTerm,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    filterAndSortPairs,
  } = useTradingPairs();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"chart" | "orderbook" | "trades">(
    "chart"
  );

  // 自动连接市场数据
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleLogout = async () => {
    await logout();
  };

  const selectedPriceData = getPriceBySymbol(selectedSymbol);
  const selectedCandles = getCandlesBySymbol(selectedSymbol);
  const filteredPriceData = filterAndSortPairs(priceData);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-dark-950 overflow-x-hidden">
      {/* 顶部价格条 */}
      <TopTicker data={priceData.slice(0, 8)} />

      {/* 主导航栏 */}
      <header className="bg-dark-900 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold gradient-text">QuantConsole</h1>

              {/* 连接状态 */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">已连接</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">
                      {connectionError || "连接中..."}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4 mr-1" />
                设置
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={connect}
                disabled={isConnected}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1 ${
                    isConnected ? "animate-spin" : ""
                  }`}
                />
                刷新
              </Button>

              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 mr-1" />
                ) : (
                  <Maximize2 className="w-4 h-4 mr-1" />
                )}
                {isFullscreen ? "退出全屏" : "全屏"}
              </Button>

              <span className="text-gray-300">
                {user?.username || user?.email}
              </span>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区 */}
      <main
        className={`${
          isFullscreen
            ? "fixed inset-0 top-0 z-50 bg-dark-950"
            : "max-w-full xl:max-w-7xl mx-auto"
        } px-2 sm:px-4 lg:px-6 xl:px-8 py-4 lg:py-6`}
      >
        <div
          className={`trading-grid ${isFullscreen ? "trading-fullscreen" : ""}`}
        >
          {/* 左侧边栏 - 价格列表 */}
          <div className={`trading-sidebar-left ${isFullscreen ? "" : ""}`}>
            {/* 搜索栏 */}
            <div className="bg-dark-800 rounded-lg p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索交易对..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                />
              </div>
            </div>

            {/* 收藏夹 */}
            {favorites.length > 0 && (
              <div className="bg-dark-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                  收藏夹
                </h3>
                <div className="space-y-2">
                  {priceData
                    .filter((p) => favorites.includes(p.symbol))
                    .map((priceData) => (
                      <button
                        key={priceData.symbol}
                        onClick={() => selectSymbol(priceData.symbol)}
                        className={`w-full p-2 rounded cursor-pointer transition-colors text-left ${
                          selectedSymbol === priceData.symbol
                            ? "bg-green-600/20 border border-green-400"
                            : "hover:bg-dark-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">
                            {priceData.symbol.replace("USDT", "")}
                          </span>
                          <div className="text-right">
                            <div className="text-sm text-white">
                              ${priceData.price.toFixed(2)}
                            </div>
                            <div
                              className={`text-xs ${
                                priceData.priceChange >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {priceData.priceChangePercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* 市场状态 */}
            <MarketStatus />

            {/* 价格列表 */}
            <PriceTicker
              data={filteredPriceData}
              onSymbolSelect={selectSymbol}
              selectedSymbol={selectedSymbol}
            />
          </div>

          {/* 中间主要区域 - 图表 */}
          <div className={`trading-main-content ${isFullscreen ? "" : ""}`}>
            {/* 选中交易对信息 */}
            {selectedPriceData && (
              <div className="bg-dark-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-white">
                      {selectedSymbol.replace("USDT", "/USDT")}
                    </h2>
                    <button
                      onClick={() => {
                        if (isFavorite(selectedSymbol)) {
                          removeFromFavorites(selectedSymbol);
                        } else {
                          addToFavorites(selectedSymbol);
                        }
                      }}
                      className="p-1 hover:bg-dark-700 rounded"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          isFavorite(selectedSymbol)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      ${selectedPriceData.price.toFixed(2)}
                    </div>
                    <div
                      className={`text-lg ${
                        selectedPriceData.priceChange >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {selectedPriceData.priceChange >= 0 ? "+" : ""}
                      {selectedPriceData.priceChange.toFixed(2)}(
                      {selectedPriceData.priceChangePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                  <div>
                    <div className="text-gray-400">24h 最高</div>
                    <div className="text-white font-mono">
                      ${selectedPriceData.high24h.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">24h 最低</div>
                    <div className="text-white font-mono">
                      ${selectedPriceData.low24h.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">24h 成交量</div>
                    <div className="text-white font-mono">
                      {(selectedPriceData.volume24h / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">更新时间</div>
                    <div className="text-white font-mono">
                      {new Date(selectedPriceData.timestamp).toLocaleTimeString(
                        "zh-CN"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 图表标签页 */}
            <div className="bg-dark-800 rounded-lg overflow-hidden">
              <div className="flex border-b border-dark-700">
                <button
                  onClick={() => setActiveTab("chart")}
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === "chart"
                      ? "text-white bg-dark-700 border-b-2 border-green-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  价格图表
                </button>
                <button
                  onClick={() => setActiveTab("orderbook")}
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === "orderbook"
                      ? "text-white bg-dark-700 border-b-2 border-green-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  深度图
                </button>
                <button
                  onClick={() => setActiveTab("trades")}
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === "trades"
                      ? "text-white bg-dark-700 border-b-2 border-green-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Activity className="w-4 h-4 inline mr-2" />
                  最新成交
                </button>
              </div>

              <div className="p-4">
                {activeTab === "chart" && (
                  <TradingChart
                    symbol={selectedSymbol}
                    data={selectedCandles}
                    height={isFullscreen ? 600 : 400}
                    showVolume={true}
                  />
                )}

                {activeTab === "orderbook" && (
                  <div className="h-96">
                    <OrderBook data={orderBook} />
                  </div>
                )}

                {activeTab === "trades" && (
                  <div className="h-96 flex items-center justify-center text-gray-400">
                    最新成交记录功能开发中...
                  </div>
                )}
              </div>
            </div>

            {/* 快速交易模块 */}
            <div className="mt-4">
              <div className="bg-dark-800 rounded-lg p-4 min-w-0">
                <QuickTradePanel
                  selectedSymbol={selectedSymbol}
                  currentPrice={selectedPriceData?.price || 0}
                />
              </div>
            </div>

            {/* 最近交易模块 */}
            <div className="mt-4">
              <div className="bg-dark-800 rounded-lg p-4">
                <RecentTrades selectedSymbol={selectedSymbol} />
              </div>
            </div>
          </div>

          {/* 右侧边栏 */}
          <div className={`trading-sidebar-right ${isFullscreen ? "" : ""}`}>
            {/* 数据源设置 */}
            {showSettings && (
              <div className="min-w-0 mb-4">
                <DataSourceSwitcher
                  isConnected={isConnected}
                  onConnectionChange={(connected) => {
                    // 可以在这里处理连接状态变化
                    console.log(`连接状态变化: ${connected}`);
                  }}
                />
              </div>
            )}

            {/* 市场统计 */}
            <div className="min-w-0">
              <MarketStats />
            </div>

            {/* 订单簿 */}
            {!isFullscreen && (
              <div className="min-w-0">
                <OrderBook data={orderBook} maxEntries={8} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
