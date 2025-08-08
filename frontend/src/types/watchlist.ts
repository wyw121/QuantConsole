export interface WatchlistToken {
  id: number;
  symbol: string;
  exchange: string;
  displayName?: string;
  isActive: boolean;
  sortOrder: number;
  currentPrice?: number;
  priceChange24h?: number;
  priceChangePercentage24h?: number;
  volume24h?: number;
  marketCap?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWatchlistTokenRequest {
  symbol: string;
  exchange: string;
  displayName?: string;
}

export interface UpdateWatchlistTokenRequest {
  displayName?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface PriceAlert {
  id: number;
  symbol: string;
  exchange: string;
  alertType: PriceAlertType;
  targetValue: number;
  comparisonValue?: number;
  condition?: any;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  notificationChannels?: string[];
  createdAt: string;
  updatedAt: string;
}

export enum PriceAlertType {
  PriceAbove = "price_above",
  PriceBelow = "price_below",
  PercentageChange = "percentage_change",
  VolumeSpike = "volume_spike",
  TechnicalIndicator = "technical_indicator",
}

export interface CreatePriceAlertRequest {
  symbol: string;
  exchange: string;
  alertType: PriceAlertType;
  targetValue: number;
  comparisonValue?: number;
  condition?: any;
  notificationChannels?: string[];
}

export interface UpdatePriceAlertRequest {
  targetValue?: number;
  comparisonValue?: number;
  condition?: any;
  isActive?: boolean;
  notificationChannels?: string[];
}

export interface WatchlistResponse {
  success: boolean;
  data: WatchlistToken[];
  pagination: PaginationInfo;
}

export interface AlertsResponse {
  success: boolean;
  data: PriceAlert[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// 实时价格数据WebSocket消息类型
export interface WatchlistPriceUpdateMessage {
  type: "price_update";
  symbol: string;
  exchange: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  timestamp: number;
}

export interface WatchlistAlertTriggerMessage {
  type: "alert_triggered";
  alertId: number;
  symbol: string;
  exchange: string;
  alertType: PriceAlertType;
  targetValue: number;
  currentValue: number;
  triggeredAt: string;
}

export type WatchlistWebSocketMessage = WatchlistPriceUpdateMessage | WatchlistAlertTriggerMessage;

// 查询参数接口
export interface WatchlistQuery {
  page?: number;
  perPage?: number;
  isActive?: boolean;
}

export interface AlertsQuery {
  page?: number;
  perPage?: number;
  isActive?: boolean;
  symbol?: string;
}

// 支持的交易所
export enum SupportedExchange {
  Binance = "binance",
  OKX = "okx",
  Huobi = "huobi",
  Coinbase = "coinbase",
  Kraken = "kraken",
}

// 通知渠道
export enum NotificationChannel {
  Email = "email",
  InApp = "in_app",
  WebPush = "web_push",
  Webhook = "webhook",
}

// 价格提醒条件
export interface AlertCondition {
  indicator?: string;
  timeframe?: string;
  threshold?: number;
  comparison?: "above" | "below" | "crossover" | "crossunder";
}

// 技术指标类型
export enum TechnicalIndicator {
  SMA = "sma",
  EMA = "ema",
  RSI = "rsi",
  MACD = "macd",
  BollingerBands = "bbands",
  Volume = "volume",
}

// WebSocket连接状态
export enum WebSocketStatus {
  Connecting = "connecting",
  Connected = "connected",
  Disconnected = "disconnected",
  Reconnecting = "reconnecting",
  Error = "error",
}
