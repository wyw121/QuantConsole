// 交易所相关类型定义

export type ExchangeType = "binance" | "okx" | "coingecko" | "mock";

export interface ExchangeInfo {
  id: ExchangeType;
  name: string;
  displayName: string;
  logoUrl?: string;
  status: "connected" | "disconnected" | "connecting" | "error";
  features: {
    spot: boolean;
    futures: boolean;
    options: boolean;
    realtime: boolean;
  };
  connectionInfo?: {
    lastConnected?: number;
    latency?: number;
    errorMessage?: string;
    dataQuality?: "excellent" | "good" | "fair" | "poor";
    reconnectAttempts?: number;
  };
}

export interface ConnectionStatus {
  exchange: ExchangeType;
  status: "connected" | "disconnected" | "connecting" | "error";
  latency: number;
  lastUpdate: number;
  errorMessage?: string;
  dataQuality: "excellent" | "good" | "fair" | "poor";
  reconnectAttempts: number;
  uptime: number; // 连接持续时间（毫秒）
}
