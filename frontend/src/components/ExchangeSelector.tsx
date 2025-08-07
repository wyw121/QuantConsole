import { ExchangeInfo, ExchangeType } from "@/types/exchange";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Clock,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface ExchangeSelectorProps {
  exchanges: ExchangeInfo[];
  selectedExchange: ExchangeType;
  onExchangeChange: (exchangeId: ExchangeType) => void;
  className?: string;
}

export const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({
  exchanges,
  selectedExchange,
  onExchangeChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedExchangeInfo = exchanges.find(
    (ex) => ex.id === selectedExchange
  );

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getStatusIcon = (status: ExchangeInfo["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "connecting":
        return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ExchangeInfo["status"]) => {
    switch (status) {
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 选择器按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-lg transition-colors duration-200 min-w-[140px]"
      >
        {selectedExchangeInfo && (
          <>
            {getStatusIcon(selectedExchangeInfo.status)}
            <span className="text-sm font-medium text-white">
              {selectedExchangeInfo.displayName}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-dark-800 border border-dark-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 px-2 py-1 border-b border-dark-700 mb-2">
              选择交易所数据源
            </div>

            {exchanges.map((exchange) => (
              <button
                key={exchange.id}
                onClick={() => {
                  onExchangeChange(exchange.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start space-x-3 px-3 py-3 rounded-lg transition-colors duration-200 text-left ${
                  selectedExchange === exchange.id
                    ? "bg-green-600/20 border border-green-400/30"
                    : "hover:bg-dark-700"
                }`}
              >
                {/* 状态图标 */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(exchange.status)}
                </div>

                {/* 交易所信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">
                      {exchange.displayName}
                    </h4>
                    <span
                      className={`text-xs ${getStatusColor(exchange.status)}`}
                    >
                      {exchange.status === "connected" && "已连接"}
                      {exchange.status === "connecting" && "连接中"}
                      {exchange.status === "disconnected" && "未连接"}
                      {exchange.status === "error" && "连接错误"}
                    </span>
                  </div>

                  {/* 功能特性 */}
                  <div className="flex items-center space-x-2 mt-1">
                    {exchange.features.spot && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded">
                        现货
                      </span>
                    )}
                    {exchange.features.futures && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-600/20 text-purple-400 rounded">
                        永续合约
                      </span>
                    )}
                    {exchange.features.realtime && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded">
                        实时
                      </span>
                    )}
                  </div>

                  {/* 连接信息 */}
                  {exchange.connectionInfo &&
                    exchange.status === "connected" && (
                      <div className="text-xs text-gray-400 mt-1">
                        延迟: {exchange.connectionInfo.latency}ms | 质量:{" "}
                        {exchange.connectionInfo.dataQuality === "excellent" &&
                          "优秀"}
                        {exchange.connectionInfo.dataQuality === "good" &&
                          "良好"}
                        {exchange.connectionInfo.dataQuality === "fair" &&
                          "一般"}
                        {exchange.connectionInfo.dataQuality === "poor" &&
                          "较差"}
                      </div>
                    )}

                  {/* 错误信息 */}
                  {exchange.status === "error" &&
                    exchange.connectionInfo?.errorMessage && (
                      <div className="text-xs text-red-400 mt-1">
                        {exchange.connectionInfo.errorMessage}
                      </div>
                    )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
