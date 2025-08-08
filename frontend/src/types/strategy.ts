// 交易策略相关类型定义

// 技术指标类型
export type TechnicalIndicatorType =
  | 'SMA'           // 简单移动平均线
  | 'EMA'           // 指数移动平均线
  | 'RSI'           // 相对强弱指数
  | 'MACD'          // 移动平均收敛散度
  | 'BOLLINGER'     // 布林带
  | 'STOCHASTIC'    // 随机指标
  | 'ATR'           // 平均真实范围
  | 'VOLUME'        // 成交量
  | 'PRICE'         // 价格
  | 'VOLATILITY';   // 波动率

// 条件操作符
export type ConditionOperator =
  | 'GT'            // 大于
  | 'LT'            // 小于
  | 'EQ'            // 等于
  | 'GTE'           // 大于等于
  | 'LTE'           // 小于等于
  | 'CROSS_UP'      // 向上穿越
  | 'CROSS_DOWN'    // 向下穿越
  | 'BETWEEN'       // 介于之间
  | 'OUTSIDE';      // 超出范围

// 逻辑门
export type LogicGate = 'AND' | 'OR';

// 策略条件
export interface StrategyCondition {
  id: string;
  indicator: TechnicalIndicatorType;
  operator: ConditionOperator;
  value: number | string | number[]; // 数组用于BETWEEN操作
  period?: number; // 指标周期参数
  logicGate?: LogicGate; // 与下一个条件的逻辑关系
  weight?: number; // 条件权重 (0-1)
}

// 风险管理规则
export interface RiskManagement {
  stopLoss?: number;          // 止损百分比
  takeProfit?: number;        // 止盈百分比
  maxPositionSize?: number;   // 最大仓位大小
  maxDailyTrades?: number;    // 每日最大交易次数
  cooldownPeriod?: number;    // 冷却期（分钟）
  trailingStop?: number;      // 跟踪止损百分比
}

// 策略类型
export type StrategyType =
  | 'TREND_FOLLOWING'    // 趋势跟踪
  | 'MEAN_REVERSION'     // 均值回归
  | 'BREAKOUT'           // 突破策略
  | 'ARBITRAGE'          // 套利策略
  | 'SCALPING'           // 剥头皮策略
  | 'SWING_TRADING'      // 摆动交易
  | 'CUSTOM';            // 自定义策略

// 策略状态
export type StrategyStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR';

// 交易信号
export interface TradingSignal {
  id: string;
  strategyId: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 信号强度 (0-1)
  price: number;
  timestamp: number;
  conditions: StrategyCondition[];
  metadata?: Record<string, any>;
}

// 回测结果
export interface BacktestResult {
  id: string;
  strategyId: string;
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgTradeDuration: number;
  volatility: number;
  trades: BacktestTrade[];
  equity: EquityPoint[];
  createdAt: string;
}

// 回测交易记录
export interface BacktestTrade {
  id: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  pnl: number;
  pnlPercent: number;
  duration: number; // 持仓时间（分钟）
  exitReason: 'SIGNAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP';
}

// 资产净值点
export interface EquityPoint {
  timestamp: number;
  equity: number;
  drawdown: number;
}

// 交易策略
export interface TradingStrategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: StrategyType;
  status: StrategyStatus;
  symbol: string;
  timeframe: string; // '1m', '5m', '15m', '1h', '4h', '1d'
  conditions: StrategyCondition[];
  riskManagement: RiskManagement;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  
  // 统计信息
  totalSignals?: number;
  successRate?: number;
  avgReturn?: number;
  subscribers?: number;
  
  // 最新回测结果
  lastBacktest?: BacktestResult;
}

// 策略模板
export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  conditions: StrategyCondition[];
  riskManagement: RiskManagement;
  tags: string[];
  usage: number; // 使用次数
  rating: number; // 评分 (1-5)
  author: string;
  createdAt: string;
}

// 策略编辑器状态
export interface StrategyEditorState {
  strategy: Partial<TradingStrategy>;
  isDirty: boolean;
  isValidating: boolean;
  validationErrors: string[];
  previewMode: boolean;
  draggedCondition?: StrategyCondition;
}

// 指标配置
export interface IndicatorConfig {
  type: TechnicalIndicatorType;
  name: string;
  description: string;
  category: 'TREND' | 'MOMENTUM' | 'VOLATILITY' | 'VOLUME' | 'PRICE';
  parameters: {
    [key: string]: {
      name: string;
      type: 'number' | 'boolean' | 'select';
      default: any;
      min?: number;
      max?: number;
      options?: Array<{ value: any; label: string }>;
      description: string;
    };
  };
  outputs: {
    [key: string]: {
      name: string;
      description: string;
      color?: string;
    };
  };
}

// 策略性能指标
export interface StrategyPerformance {
  strategyId: string;
  period: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  trades: number;
  avgTradeReturn: number;
  bestTrade: number;
  worstTrade: number;
  updatedAt: string;
}

// 策略订阅
export interface StrategySubscription {
  id: string;
  userId: string;
  strategyId: string;
  isActive: boolean;
  notifications: {
    signals: boolean;
    performance: boolean;
    updates: boolean;
  };
  createdAt: string;
}

// API 响应类型
export interface StrategyListResponse {
  strategies: TradingStrategy[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BacktestRequest {
  strategyId: string;
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  timeframe: string;
}

export interface StrategyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
