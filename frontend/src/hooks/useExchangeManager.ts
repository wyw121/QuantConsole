import { marketDataService } from "@/services/unifiedMarketData";
import { ConnectionStatus, ExchangeInfo, ExchangeType } from "@/types/exchange";
import { useCallback, useEffect, useState } from "react";

// 支持永续合约交易的交易所配置
const AVAILABLE_EXCHANGES: ExchangeInfo[] = [
  {
    id: "coingecko",
    name: "coingecko",
    displayName: "CoinGecko",
    status: "disconnected",
    features: {
      spot: false,
      futures: true,
      options: false,
      realtime: false,
    },
    connectionInfo: {
      latency: 0,
      dataQuality: "good",
      reconnectAttempts: 0,
    },
  },
  {
    id: "binance",
    name: "binance",
    displayName: "Binance Futures",
    status: "disconnected",
    features: {
      spot: false,
      futures: true,
      options: false,
      realtime: true,
    },
    connectionInfo: {
      latency: 0,
      dataQuality: "excellent",
      reconnectAttempts: 0,
    },
  },
  {
    id: "okx",
    name: "okx",
    displayName: "OKX Perpetual",
    status: "disconnected",
    features: {
      spot: false,
      futures: true,
      options: true,
      realtime: true,
    },
    connectionInfo: {
      latency: 0,
      dataQuality: "excellent",
      reconnectAttempts: 0,
    },
  },
  {
    id: "mock",
    name: "mock",
    displayName: "模拟永续合约",
    status: "disconnected",
    features: {
      spot: false,
      futures: true,
      options: true,
      realtime: true,
    },
    connectionInfo: {
      latency: 0,
      dataQuality: "excellent",
      reconnectAttempts: 0,
    },
  },
];

export const useExchangeManager = () => {
  const [exchanges, setExchanges] =
    useState<ExchangeInfo[]>(AVAILABLE_EXCHANGES);
  const [selectedExchange, setSelectedExchange] =
    useState<ExchangeType>("coingecko");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    exchange: "coingecko",
    status: "disconnected",
    latency: 0,
    lastUpdate: Date.now(),
    dataQuality: "good",
    reconnectAttempts: 0,
    uptime: 0,
  });

  const [connectionStartTime, setConnectionStartTime] = useState<number>(0);

  // 更新交易所状态
  const updateExchangeStatus = useCallback(
    (
      exchangeId: ExchangeType,
      status: ExchangeInfo["status"],
      connectionInfo?: Partial<ExchangeInfo["connectionInfo"]>
    ) => {
      setExchanges((prev) =>
        prev.map((exchange) =>
          exchange.id === exchangeId
            ? {
                ...exchange,
                status,
                connectionInfo: {
                  ...exchange.connectionInfo,
                  ...connectionInfo,
                  lastConnected:
                    status === "connected"
                      ? Date.now()
                      : exchange.connectionInfo?.lastConnected,
                },
              }
            : exchange
        )
      );

      // 如果是当前选中的交易所，更新连接状态
      if (exchangeId === selectedExchange) {
        setConnectionStatus((prev) => ({
          ...prev,
          exchange: exchangeId,
          status,
          lastUpdate: Date.now(),
          ...connectionInfo,
          uptime:
            status === "connected" && prev.status !== "connected"
              ? 0
              : status === "connected"
              ? prev.uptime
              : 0,
        }));

        if (status === "connected" && connectionStatus.status !== "connected") {
          setConnectionStartTime(Date.now());
        }
      }
    },
    [selectedExchange, connectionStatus.status]
  );

  // 模拟连接延迟和数据质量监控
  useEffect(() => {
    if (connectionStatus.status !== "connected") return;

    const interval = setInterval(() => {
      // 模拟网络延迟变化
      const baseLatency =
        selectedExchange === "mock"
          ? 5
          : selectedExchange === "coingecko"
          ? 150
          : selectedExchange === "binance"
          ? 50
          : 80;

      const jitter = Math.random() * 50 - 25; // ±25ms 抖动
      const newLatency = Math.max(1, Math.floor(baseLatency + jitter));

      // 根据延迟判断数据质量
      let dataQuality: ConnectionStatus["dataQuality"] = "excellent";
      if (newLatency > 200) dataQuality = "poor";
      else if (newLatency > 100) dataQuality = "fair";
      else if (newLatency > 50) dataQuality = "good";

      const uptime =
        connectionStartTime > 0 ? Date.now() - connectionStartTime : 0;

      setConnectionStatus((prev) => ({
        ...prev,
        latency: newLatency,
        dataQuality,
        lastUpdate: Date.now(),
        uptime,
      }));

      // 同步更新交易所信息
      updateExchangeStatus(selectedExchange, "connected", {
        latency: newLatency,
        dataQuality,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [
    connectionStatus.status,
    selectedExchange,
    connectionStartTime,
    updateExchangeStatus,
  ]);

  // 切换交易所
  const switchExchange = useCallback(
    async (exchangeId: ExchangeType) => {
      if (exchangeId === selectedExchange) return;

      console.log(`🔄 切换交易所: ${selectedExchange} → ${exchangeId}`);

      // 断开当前连接
      if (connectionStatus.status === "connected") {
        updateExchangeStatus(selectedExchange, "disconnected");
      }

      // 更新选中的交易所
      setSelectedExchange(exchangeId);

      // 开始连接新交易所
      updateExchangeStatus(exchangeId, "connecting");

      try {
        // 切换统一市场数据服务的数据源
        const dataSourceMap: Record<
          ExchangeType,
          "mock" | "real" | "coingecko" | "binance"
        > = {
          mock: "mock",
          coingecko: "coingecko",
          binance: "binance",
          okx: "real", // OKX暂时使用real数据源
        };

        console.log(`📊 切换到数据源: ${dataSourceMap[exchangeId]}`);
        const success = await marketDataService.switchDataSource(
          dataSourceMap[exchangeId]
        );

        if (success) {
          // 模拟连接延迟
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 + Math.random() * 2000)
          );

          updateExchangeStatus(exchangeId, "connected", {
            latency:
              exchangeId === "mock"
                ? 5
                : exchangeId === "coingecko"
                ? 150
                : exchangeId === "binance"
                ? 50
                : 80,
            dataQuality: "excellent",
            reconnectAttempts: 0,
          });

          setConnectionStartTime(Date.now());
          console.log(`✅ 交易所 ${exchangeId} 连接成功`);
        } else {
          throw new Error("数据源切换失败");
        }
      } catch (error) {
        console.error("交易所连接失败:", error);
        updateExchangeStatus(exchangeId, "error", {
          errorMessage: error instanceof Error ? error.message : "连接失败",
        });
      }
    },
    [selectedExchange, connectionStatus.status, updateExchangeStatus]
  );

  // 重新连接当前交易所
  const reconnect = useCallback(async () => {
    const currentExchange = selectedExchange;
    updateExchangeStatus(currentExchange, "connecting", {
      reconnectAttempts: (connectionStatus.reconnectAttempts || 0) + 1,
    });

    try {
      // 重新连接
      const connected = await marketDataService.connect();

      if (connected) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 1000)
        );

        updateExchangeStatus(currentExchange, "connected", {
          latency:
            currentExchange === "mock"
              ? 5
              : currentExchange === "coingecko"
              ? 150
              : currentExchange === "binance"
              ? 50
              : 80,
          dataQuality: "excellent",
          errorMessage: undefined,
        });

        setConnectionStartTime(Date.now());
      } else {
        throw new Error("重连失败");
      }
    } catch (error) {
      console.error("重连失败:", error);
      updateExchangeStatus(currentExchange, "error", {
        errorMessage: error instanceof Error ? error.message : "重连失败",
      });
    }
  }, [
    selectedExchange,
    connectionStatus.reconnectAttempts,
    updateExchangeStatus,
  ]);

  // 初始化时连接到默认交易所
  useEffect(() => {
    if (selectedExchange) {
      switchExchange(selectedExchange);
    }
  }, []); // 只在组件挂载时执行一次

  return {
    exchanges,
    selectedExchange,
    connectionStatus,
    switchExchange,
    reconnect,
    getCurrentExchange: () =>
      exchanges.find((ex) => ex.id === selectedExchange),
  };
};
