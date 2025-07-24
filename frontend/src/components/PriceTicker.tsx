import { PriceData } from "@/types/trading";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { SimplePriceChart } from "./TradingChart";

interface PriceTickerProps {
  data: PriceData[];
  onSymbolSelect?: (symbol: string) => void;
  selectedSymbol?: string;
}

export const PriceTicker: React.FC<PriceTickerProps> = ({
  data,
  onSymbolSelect,
  selectedSymbol,
}) => {
  const [priceHistory, setPriceHistory] = useState<Map<string, number[]>>(
    new Map()
  );

  // 记录价格历史用于小图表
  useEffect(() => {
    data.forEach((priceData) => {
      setPriceHistory((prev) => {
        const history = prev.get(priceData.symbol) || [];
        const newHistory = [...history, priceData.price].slice(-20); // 保持最近20个价格点
        const newMap = new Map(prev);
        newMap.set(priceData.symbol, newHistory);
        return newMap;
      });
    });
  }, [data]);

  const formatPrice = (price: number, symbol: string) => {
    if (
      symbol.includes("DOGE") ||
      symbol.includes("ADA") ||
      symbol.includes("XRP")
    ) {
      return price.toFixed(4);
    }
    return price.toFixed(2);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(0);
  };

  return (
    <div className="bg-dark-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-dark-700">
        <h3 className="text-lg font-medium text-white flex items-center">
          <Activity className="w-5 h-5 mr-2 text-green-400" />
          市场行情
        </h3>
      </div>

      <div className="divide-y divide-dark-700 max-h-96 overflow-y-auto">
        {data.map((priceData) => {
          const history = priceHistory.get(priceData.symbol) || [];
          const isPositive = priceData.priceChange >= 0;
          const isSelected = selectedSymbol === priceData.symbol;

          return (
            <div
              key={priceData.symbol}
              onClick={() => onSymbolSelect?.(priceData.symbol)}
              className={`p-4 hover:bg-dark-700 transition-colors cursor-pointer ${
                isSelected ? "bg-dark-700 border-l-2 border-green-400" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                {/* 交易对信息 */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">
                      {priceData.symbol.replace("USDT", "/USDT")}
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">
                        ${formatPrice(priceData.price, priceData.symbol)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div
                      className={`flex items-center ${
                        isPositive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span>
                        {isPositive ? "+" : ""}
                        {priceData.priceChangePercent.toFixed(2)}%
                      </span>
                    </div>

                    <span className="text-gray-400">
                      Vol: {formatVolume(priceData.volume24h)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>
                      H: ${formatPrice(priceData.high24h, priceData.symbol)}
                    </span>
                    <span>
                      L: ${formatPrice(priceData.low24h, priceData.symbol)}
                    </span>
                  </div>
                </div>

                {/* 迷你图表 */}
                <div className="w-16 ml-3">
                  {history.length > 1 && (
                    <SimplePriceChart
                      data={history}
                      labels={history.map((_, i) => i.toString())}
                      positive={isPositive}
                      height={40}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 顶部价格条组件
interface TopTickerProps {
  data: PriceData[];
  maxItems?: number;
}

export const TopTicker: React.FC<TopTickerProps> = ({ data, maxItems = 5 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 自动轮播
  useEffect(() => {
    if (data.length <= maxItems) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (data.length - maxItems + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [data.length, maxItems]);

  const visibleData = data.slice(currentIndex, currentIndex + maxItems);

  return (
    <div className="bg-dark-900 border-b border-dark-700 py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center space-x-8">
          {visibleData.map((priceData) => {
            const isPositive = priceData.priceChange >= 0;

            return (
              <div
                key={priceData.symbol}
                className="flex items-center space-x-2 min-w-0 flex-shrink-0"
              >
                <span className="text-gray-300 font-medium">
                  {priceData.symbol.replace("USDT", "")}
                </span>
                <span className="text-white font-semibold">
                  ${formatPrice(priceData.price, priceData.symbol)}
                </span>
                <span
                  className={`text-sm ${
                    isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {priceData.priceChangePercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  function formatPrice(price: number, symbol: string) {
    if (
      symbol.includes("DOGE") ||
      symbol.includes("ADA") ||
      symbol.includes("XRP")
    ) {
      return price.toFixed(4);
    }
    return price.toFixed(2);
  }
};
