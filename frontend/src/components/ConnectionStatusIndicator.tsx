import { ConnectionStatus } from "@/types/exchange";
import {
  Activity,
  AlertTriangle,
  Clock,
  Info,
  Signal,
  Timer,
  Wifi,
  WifiOff,
} from "lucide-react";
import React, { useState } from "react";

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

export const ConnectionStatusIndicator: React.FC<
  ConnectionStatusIndicatorProps
> = ({ status, className = "" }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusIcon = () => {
    switch (status.status) {
      case "connected":
        return <Wifi className="w-4 h-4 text-green-400" />;
      case "connecting":
        return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case "error":
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case "connected":
        return "已连接";
      case "connecting":
        return "连接中";
      case "error":
        return "连接错误";
      default:
        return "未连接";
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case "connected":
        return "text-green-400";
      case "connecting":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getDataQualityColor = () => {
    switch (status.dataQuality) {
      case "excellent":
        return "text-green-400";
      case "good":
        return "text-blue-400";
      case "fair":
        return "text-yellow-400";
      case "poor":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getDataQualityText = () => {
    switch (status.dataQuality) {
      case "excellent":
        return "优秀";
      case "good":
        return "良好";
      case "fair":
        return "一般";
      case "poor":
        return "较差";
      default:
        return "未知";
    }
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      className={`relative flex items-center space-x-2 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* 状态图标和文本 */}
      <div className="flex items-center space-x-2 cursor-pointer">
        {getStatusIcon()}
        <span className={`text-sm ${getStatusColor()}`}>{getStatusText()}</span>
      </div>

      {/* 详细信息工具提示 */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50 p-4">
          {/* 标题 */}
          <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-dark-700">
            <Info className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-medium text-white">连接状态详情</h3>
          </div>

          {/* 基本信息 */}
          <div className="space-y-3">
            {/* 交易所和状态 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">交易所:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white font-medium">
                  {status.exchange.toUpperCase()}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    status.status === "connected"
                      ? "bg-green-600/20 text-green-400"
                      : status.status === "connecting"
                      ? "bg-yellow-600/20 text-yellow-400"
                      : "bg-red-600/20 text-red-400"
                  }`}
                >
                  {getStatusText()}
                </span>
              </div>
            </div>

            {/* 网络延迟 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Activity className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">网络延迟:</span>
              </div>
              <span
                className={`text-sm font-mono ${
                  status.latency < 50
                    ? "text-green-400"
                    : status.latency < 150
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {status.latency}ms
              </span>
            </div>

            {/* 数据质量 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Signal className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">数据质量:</span>
              </div>
              <span className={`text-sm ${getDataQualityColor()}`}>
                {getDataQualityText()}
              </span>
            </div>

            {/* 连接时长 */}
            {status.status === "connected" && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Timer className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">连接时长:</span>
                </div>
                <span className="text-sm text-white font-mono">
                  {formatUptime(status.uptime)}
                </span>
              </div>
            )}

            {/* 最后更新时间 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">最后更新:</span>
              <span className="text-sm text-white font-mono">
                {formatTimestamp(status.lastUpdate)}
              </span>
            </div>

            {/* 重连次数 */}
            {status.reconnectAttempts > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">重连次数:</span>
                <span className="text-sm text-yellow-400">
                  {status.reconnectAttempts}
                </span>
              </div>
            )}

            {/* 错误信息 */}
            {status.errorMessage && (
              <div className="mt-3 pt-2 border-t border-dark-700">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-400 mb-1">错误信息:</div>
                    <div className="text-sm text-red-400 break-words">
                      {status.errorMessage}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 连接质量指示器 */}
          <div className="mt-4 pt-3 border-t border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">连接质量:</span>
              <span className={`text-xs ${getDataQualityColor()}`}>
                {getDataQualityText()}
              </span>
            </div>

            {/* 质量进度条 */}
            <div className="w-full bg-dark-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  status.dataQuality === "excellent"
                    ? "bg-green-400 w-full"
                    : status.dataQuality === "good"
                    ? "bg-blue-400 w-3/4"
                    : status.dataQuality === "fair"
                    ? "bg-yellow-400 w-1/2"
                    : "bg-red-400 w-1/4"
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
