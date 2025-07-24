import {
  Activity,
  BarChart3,
  DollarSign,
  Globe,
  TrendingUp,
  Zap,
} from "lucide-react";
import React from "react";

interface MarketStatsProps {
  totalMarketCap?: number;
  totalVolume24h?: number;
  btcDominance?: number;
  ethDominance?: number;
  fearGreedIndex?: number;
  className?: string;
}

export const MarketStats: React.FC<MarketStatsProps> = ({
  totalMarketCap = 2850000000000, // $2.85T 默认值
  totalVolume24h = 95000000000, // $95B 默认值
  btcDominance = 52.3, // 52.3% 默认值
  ethDominance = 17.8, // 17.8% 默认值
  fearGreedIndex = 75, // 75 默认值 (贪婪)
  className = "",
}) => {
  const formatCurrency = (value: number) => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    }
    return `$${value.toFixed(2)}`;
  };

  const getFearGreedColor = (index: number) => {
    if (index >= 75) return "text-green-400";
    if (index >= 55) return "text-yellow-400";
    if (index >= 45) return "text-orange-400";
    if (index >= 25) return "text-red-400";
    return "text-red-600";
  };

  const getFearGreedLabel = (index: number) => {
    if (index >= 75) return "极度贪婪";
    if (index >= 55) return "贪婪";
    if (index >= 45) return "中性";
    if (index >= 25) return "恐惧";
    return "极度恐惧";
  };

  const stats = [
    {
      icon: Globe,
      label: "总市值",
      value: formatCurrency(totalMarketCap),
      subvalue: "24h",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      icon: BarChart3,
      label: "24h成交量",
      value: formatCurrency(totalVolume24h),
      subvalue: "+5.2%",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
    {
      icon: DollarSign,
      label: "BTC 市值占比",
      value: `${btcDominance.toFixed(1)}%`,
      subvalue: "-0.3%",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
    {
      icon: Activity,
      label: "ETH 市值占比",
      value: `${ethDominance.toFixed(1)}%`,
      subvalue: "+0.1%",
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
    },
    {
      icon: TrendingUp,
      label: "恐惧贪婪指数",
      value: fearGreedIndex.toString(),
      subvalue: getFearGreedLabel(fearGreedIndex),
      color: getFearGreedColor(fearGreedIndex),
      bgColor: "bg-gray-400/10",
    },
    {
      icon: Zap,
      label: "活跃交易对",
      value: "12,847",
      subvalue: "24h",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
  ];

  return (
    <div className={`market-overview-container ${className}`}>
      <div className="market-overview-header">
        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mr-2" />
        <h3 className="market-overview-title">市场概览</h3>
      </div>

      <div className="market-overview-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div key={index} className="market-stat-card">
              <div className="market-stat-header">
                <div className={`market-stat-icon ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
                <div className="market-stat-value-container">
                  <div className={`market-stat-value ${stat.color}`}>
                    {stat.value}
                  </div>
                </div>
              </div>

              <div className="market-stat-footer">
                <span className="market-stat-label">{stat.label}</span>
                <span className="market-stat-subvalue">{stat.subvalue}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 恐惧贪婪指数详细显示 */}
      <div className="fear-greed-container">
        <div className="fear-greed-header">
          <span className="fear-greed-title">恐惧贪婪指数</span>
          <span
            className={`fear-greed-value ${getFearGreedColor(fearGreedIndex)}`}
          >
            {fearGreedIndex} - {getFearGreedLabel(fearGreedIndex)}
          </span>
        </div>

        {/* 进度条 */}
        <div className="progress-bar-container">
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${
                fearGreedIndex >= 75
                  ? "bg-green-400"
                  : fearGreedIndex >= 55
                  ? "bg-yellow-400"
                  : fearGreedIndex >= 45
                  ? "bg-orange-400"
                  : fearGreedIndex >= 25
                  ? "bg-red-400"
                  : "bg-red-600"
              }`}
              style={{ width: `${fearGreedIndex}%` }}
            />
          </div>

          {/* 刻度标记 */}
          <div className="progress-bar-labels">
            <span className="progress-label-mobile">恐惧</span>
            <span className="progress-label-tablet">极度恐惧</span>
            <span className="progress-label-desktop">极度恐惧</span>
            <span className="progress-label-desktop">恐惧</span>
            <span className="progress-label-desktop">中性</span>
            <span className="progress-label-desktop">贪婪</span>
            <span className="progress-label-tablet">极度贪婪</span>
            <span className="progress-label-desktop">极度贪婪</span>
            <span className="progress-label-mobile">贪婪</span>
          </div>
        </div>
      </div>

      {/* 更新时间 */}
      <div className="mt-3 sm:mt-4 text-center text-xs text-gray-500">
        最后更新: {new Date().toLocaleString("zh-CN")}
      </div>
    </div>
  );
};

// 简化的市场状态组件
export const MarketStatus: React.FC = () => {
  return (
    <div className="bg-dark-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse" />
          <span className="text-white font-medium">市场状态</span>
        </div>
        <span className="text-green-400 text-sm">正常运行</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-gray-400">延迟</div>
          <div className="text-green-400 font-mono">12ms</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">TPS</div>
          <div className="text-blue-400 font-mono">1,247</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">正常运行时间</div>
          <div className="text-purple-400 font-mono">99.9%</div>
        </div>
      </div>
    </div>
  );
};
