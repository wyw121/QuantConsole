import { OrderBookEntry, OrderBook as OrderBookType } from "@/types/trading";
import { BookOpen, TrendingDown, TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";

interface OrderBookProps {
  data: OrderBookType | null;
  maxEntries?: number;
}

export const OrderBook: React.FC<OrderBookProps> = ({
  data,
  maxEntries = 10,
}) => {
  const [spreadInfo, setSpreadInfo] = useState<{
    spread: number;
    spreadPercent: number;
  } | null>(null);

  useEffect(() => {
    if (data && data.asks.length > 0 && data.bids.length > 0) {
      const bestAsk = data.asks[0].price;
      const bestBid = data.bids[0].price;
      const spread = bestAsk - bestBid;
      const spreadPercent = (spread / bestAsk) * 100;

      setSpreadInfo({ spread, spreadPercent });
    }
  }, [data]);

  if (!data) {
    return (
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-gray-400">加载订单簿...</div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => price.toFixed(2);
  const formatAmount = (amount: number) => amount.toFixed(4);

  // 计算最大数量用于显示深度条
  const maxBidAmount = Math.max(
    ...data.bids.slice(0, maxEntries).map((b) => b.amount)
  );
  const maxAskAmount = Math.max(
    ...data.asks.slice(0, maxEntries).map((a) => a.amount)
  );
  const maxAmount = Math.max(maxBidAmount, maxAskAmount);

  // 订单簿条目组件
  const OrderBookEntry: React.FC<{
    entry: OrderBookEntry;
    type: "bid" | "ask";
    maxAmount: number;
  }> = ({ entry, type, maxAmount }) => {
    const depthPercent = (entry.amount / maxAmount) * 100;

    return (
      <div className="relative flex items-center justify-between py-1 px-2 hover:bg-dark-700 transition-colors">
        {/* 深度背景条 */}
        <div
          className={`absolute inset-y-0 right-0 opacity-20 ${
            type === "bid" ? "bg-green-500" : "bg-red-500"
          }`}
          style={{ width: `${depthPercent}%` }}
        />

        {/* 价格 */}
        <span
          className={`font-mono text-sm ${
            type === "bid" ? "text-green-400" : "text-red-400"
          }`}
        >
          ${formatPrice(entry.price)}
        </span>

        {/* 数量 */}
        <span className="font-mono text-sm text-gray-300">
          {formatAmount(entry.amount)}
        </span>

        {/* 累计 */}
        <span className="font-mono text-xs text-gray-500">
          {formatAmount(entry.amount * entry.price)}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-dark-800 rounded-lg overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-400" />
            订单簿 - {data.symbol}
          </h3>

          {/* 价差信息 */}
          {spreadInfo && (
            <div className="text-right text-sm">
              <div className="text-gray-300">
                价差: ${spreadInfo.spread.toFixed(2)}
              </div>
              <div className="text-gray-500">
                ({spreadInfo.spreadPercent.toFixed(3)}%)
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* 表头 */}
        <div className="flex items-center justify-between py-2 px-2 text-xs text-gray-500 border-b border-dark-700 mb-2">
          <span>价格 (USDT)</span>
          <span>数量</span>
          <span>累计</span>
        </div>

        {/* 卖单 (Ask) - 从高到低显示 */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 text-red-400 mr-1" />
            <span className="text-sm text-red-400">卖单</span>
          </div>

          <div className="space-y-0.5">
            {data.asks
              .slice(0, maxEntries)
              .reverse() // 价格从高到低显示
              .map((ask, index) => (
                <OrderBookEntry
                  key={`ask-${index}`}
                  entry={ask}
                  type="ask"
                  maxAmount={maxAmount}
                />
              ))}
          </div>
        </div>

        {/* 当前价格 */}
        {data.asks.length > 0 && data.bids.length > 0 && (
          <div className="my-4 py-3 px-2 bg-dark-700 rounded text-center">
            <div className="text-lg font-bold text-white">
              ${((data.asks[0].price + data.bids[0].price) / 2).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">当前价格</div>
          </div>
        )}

        {/* 买单 (Bid) - 从高到低显示 */}
        <div>
          <div className="flex items-center mb-2">
            <TrendingDown className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">买单</span>
          </div>

          <div className="space-y-0.5">
            {data.bids.slice(0, maxEntries).map((bid, index) => (
              <OrderBookEntry
                key={`bid-${index}`}
                entry={bid}
                type="bid"
                maxAmount={maxAmount}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 底部统计 */}
      <div className="p-4 border-t border-dark-700 bg-dark-900">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">总买量</div>
            <div className="text-green-400 font-mono">
              {formatAmount(
                data.bids.reduce((sum, bid) => sum + bid.amount, 0)
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-400">总卖量</div>
            <div className="text-red-400 font-mono">
              {formatAmount(
                data.asks.reduce((sum, ask) => sum + ask.amount, 0)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
