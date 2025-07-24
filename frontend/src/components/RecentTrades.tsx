import {
  Clock,
  Download,
  Filter,
  History,
  MoreHorizontal,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "./Button";

interface Trade {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT" | "STOP_LOSS" | "TAKE_PROFIT";
  quantity: number;
  price: number;
  total: number;
  fee: number;
  feeAsset: string;
  status: "FILLED" | "PARTIALLY_FILLED" | "CANCELLED" | "PENDING";
  timestamp: number;
  orderId: string;
}

interface RecentTradesProps {
  selectedSymbol: string;
}

export const RecentTrades: React.FC<RecentTradesProps> = ({
  selectedSymbol,
}) => {
  const [filter, setFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [timeFilter, setTimeFilter] = useState<"24H" | "7D" | "30D" | "ALL">(
    "24H"
  );
  const [loading, setLoading] = useState(false);

  // 模拟交易数据
  const mockTrades: Trade[] = [
    {
      id: "1",
      symbol: "BTCUSDT",
      side: "BUY",
      type: "MARKET",
      quantity: 0.0025,
      price: 43250.5,
      total: 108.13,
      fee: 0.1081,
      feeAsset: "USDT",
      status: "FILLED",
      timestamp: Date.now() - 300000, // 5分钟前
      orderId: "ORD001",
    },
    {
      id: "2",
      symbol: "BTCUSDT",
      side: "SELL",
      type: "LIMIT",
      quantity: 0.001,
      price: 43300.0,
      total: 43.3,
      fee: 0.0433,
      feeAsset: "USDT",
      status: "FILLED",
      timestamp: Date.now() - 1800000, // 30分钟前
      orderId: "ORD002",
    },
    {
      id: "3",
      symbol: "ETHUSDT",
      side: "BUY",
      type: "MARKET",
      quantity: 0.05,
      price: 2580.75,
      total: 129.04,
      fee: 0.129,
      feeAsset: "USDT",
      status: "FILLED",
      timestamp: Date.now() - 3600000, // 1小时前
      orderId: "ORD003",
    },
    {
      id: "4",
      symbol: "BTCUSDT",
      side: "BUY",
      type: "LIMIT",
      quantity: 0.002,
      price: 43180.0,
      total: 86.36,
      fee: 0.0864,
      feeAsset: "USDT",
      status: "CANCELLED",
      timestamp: Date.now() - 7200000, // 2小时前
      orderId: "ORD004",
    },
    {
      id: "5",
      symbol: "BTCUSDT",
      side: "SELL",
      type: "STOP_LOSS",
      quantity: 0.0015,
      price: 43000.0,
      total: 64.5,
      fee: 0.0645,
      feeAsset: "USDT",
      status: "PARTIALLY_FILLED",
      timestamp: Date.now() - 10800000, // 3小时前
      orderId: "ORD005",
    },
  ];

  // 根据选择的交易对过滤数据
  const filteredTrades = useMemo(() => {
    let filtered = mockTrades;

    // 按交易对过滤
    if (selectedSymbol && selectedSymbol !== "BTCUSDT") {
      filtered = filtered.filter((trade) => trade.symbol === selectedSymbol);
    }

    // 按买卖方向过滤
    if (filter !== "ALL") {
      filtered = filtered.filter((trade) => trade.side === filter);
    }

    // 按时间过滤
    const now = Date.now();
    switch (timeFilter) {
      case "24H":
        filtered = filtered.filter(
          (trade) => now - trade.timestamp <= 24 * 60 * 60 * 1000
        );
        break;
      case "7D":
        filtered = filtered.filter(
          (trade) => now - trade.timestamp <= 7 * 24 * 60 * 60 * 1000
        );
        break;
      case "30D":
        filtered = filtered.filter(
          (trade) => now - trade.timestamp <= 30 * 24 * 60 * 60 * 1000
        );
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedSymbol, filter, timeFilter]);

  const handleRefresh = () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;

    if (diff < 60000) {
      return "刚刚";
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FILLED":
        return "text-green-400";
      case "PARTIALLY_FILLED":
        return "text-yellow-400";
      case "CANCELLED":
        return "text-red-400";
      case "PENDING":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "FILLED":
        return "已成交";
      case "PARTIALLY_FILLED":
        return "部分成交";
      case "CANCELLED":
        return "已取消";
      case "PENDING":
        return "待成交";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* 标题和控制栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-white" />
          <h3 className="text-lg font-medium text-white">最近交易</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "ALL" | "BUY" | "SELL")
            }
            className="bg-dark-700 border border-dark-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-green-400"
          >
            <option value="ALL">全部</option>
            <option value="BUY">买入</option>
            <option value="SELL">卖出</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <select
            value={timeFilter}
            onChange={(e) =>
              setTimeFilter(e.target.value as "24H" | "7D" | "30D" | "ALL")
            }
            className="bg-dark-700 border border-dark-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-green-400"
          >
            <option value="24H">24小时</option>
            <option value="7D">7天</option>
            <option value="30D">30天</option>
            <option value="ALL">全部</option>
          </select>
        </div>
      </div>

      {/* 交易列表 */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">加载中...</span>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无交易记录</p>
            <p className="text-sm">完成首笔交易后将在此显示</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredTrades.map((trade) => (
              <div
                key={trade.id}
                className="bg-dark-700 rounded-lg p-3 hover:bg-dark-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-1 rounded ${
                        trade.side === "BUY"
                          ? "bg-green-600/20"
                          : "bg-red-600/20"
                      }`}
                    >
                      {trade.side === "BUY" ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">
                          {trade.side === "BUY" ? "买入" : "卖出"}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {trade.symbol}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${getStatusColor(
                            trade.status
                          )} bg-opacity-20`}
                        >
                          {getStatusText(trade.status)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatTime(trade.timestamp)} • {trade.type}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">数量</div>
                    <div className="text-white font-mono">
                      {trade.quantity.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">价格</div>
                    <div className="text-white font-mono">
                      ${trade.price.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">总额</div>
                    <div className="text-white font-mono">
                      ${trade.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {trade.fee > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    手续费: {trade.fee.toFixed(4)} {trade.feeAsset}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      {filteredTrades.length > 0 && (
        <div className="border-t border-dark-700 pt-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">总交易次数</div>
              <div className="text-white font-medium">
                {filteredTrades.filter((t) => t.status === "FILLED").length}
              </div>
            </div>
            <div>
              <div className="text-gray-400">总交易额</div>
              <div className="text-white font-medium">
                $
                {filteredTrades
                  .filter((t) => t.status === "FILLED")
                  .reduce((sum, t) => sum + t.total, 0)
                  .toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
