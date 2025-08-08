import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  TradingStrategy,
  StrategyTemplate,
  BacktestResult,
  TradingSignal,
  StrategyEditorState,
  StrategyPerformance,
  StrategyCondition,
  StrategyStatus,
} from '@/types/strategy';
import { strategyService } from '@/services/strategyService';

interface StrategyState {
  // 策略列表
  strategies: TradingStrategy[];
  templates: StrategyTemplate[];
  publicStrategies: TradingStrategy[];
  
  // 当前选中的策略
  selectedStrategy: TradingStrategy | null;
  selectedTemplate: StrategyTemplate | null;
  
  // 编辑器状态
  editorState: StrategyEditorState;
  
  // 回测相关
  backtestResults: BacktestResult[];
  runningBacktests: Map<string, { status: string; progress: number }>;
  
  // 信号相关
  signals: TradingSignal[];
  signalWebSocket: WebSocket | null;
  
  // 性能数据
  performanceData: Map<string, StrategyPerformance>;
  
  // UI 状态
  loading: {
    strategies: boolean;
    templates: boolean;
    backtest: boolean;
    signals: boolean;
  };
  
  error: string | null;
  
  // Actions
  // 策略管理
  fetchStrategies: (params?: any) => Promise<void>;
  createStrategy: (strategy: Partial<TradingStrategy>) => Promise<string>;
  updateStrategy: (id: string, strategy: Partial<TradingStrategy>) => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;
  selectStrategy: (strategy: TradingStrategy | null) => void;
  cloneStrategy: (id: string, name?: string) => Promise<string>;
  
  // 策略控制
  startStrategy: (id: string) => Promise<void>;
  stopStrategy: (id: string) => Promise<void>;
  pauseStrategy: (id: string) => Promise<void>;
  
  // 模板管理
  fetchTemplates: (params?: any) => Promise<void>;
  selectTemplate: (template: StrategyTemplate | null) => void;
  createFromTemplate: (templateId: string, customization?: any) => Promise<string>;
  
  // 编辑器
  initializeEditor: (strategy?: Partial<TradingStrategy>) => void;
  updateEditorStrategy: (updates: Partial<TradingStrategy>) => void;
  addCondition: (condition: StrategyCondition) => void;
  updateCondition: (index: number, condition: StrategyCondition) => void;
  removeCondition: (index: number) => void;
  reorderConditions: (fromIndex: number, toIndex: number) => void;
  validateStrategy: () => Promise<void>;
  resetEditor: () => void;
  
  // 回测
  runBacktest: (request: any) => Promise<string>;
  fetchBacktestResult: (id: string) => Promise<void>;
  fetchStrategyBacktests: (strategyId: string) => Promise<void>;
  
  // 信号管理
  fetchSignals: (strategyId?: string, params?: any) => Promise<void>;
  connectSignalWebSocket: () => void;
  disconnectSignalWebSocket: () => void;
  
  // 性能数据
  fetchPerformance: (strategyId: string, period?: string) => Promise<void>;
  
  // 策略市场
  fetchPublicStrategies: (params?: any) => Promise<void>;
  publishStrategy: (id: string) => Promise<void>;
  subscribeToStrategy: (id: string) => Promise<void>;
  
  // 工具方法
  clearError: () => void;
  setLoading: (key: keyof StrategyState['loading'], value: boolean) => void;
}

const initialEditorState: StrategyEditorState = {
  strategy: {
    name: '',
    description: '',
    type: 'CUSTOM',
    symbol: 'BTCUSDT',
    timeframe: '1h',
    conditions: [],
    riskManagement: {
      stopLoss: 2,
      takeProfit: 6,
      maxPositionSize: 10,
      maxDailyTrades: 5,
    },
    isPublic: false,
    tags: [],
  },
  isDirty: false,
  isValidating: false,
  validationErrors: [],
  previewMode: false,
};

export const useStrategyStore = create<StrategyState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        strategies: [],
        templates: [],
        publicStrategies: [],
        selectedStrategy: null,
        selectedTemplate: null,
        editorState: { ...initialEditorState },
        backtestResults: [],
        runningBacktests: new Map(),
        signals: [],
        signalWebSocket: null,
        performanceData: new Map(),
        loading: {
          strategies: false,
          templates: false,
          backtest: false,
          signals: false,
        },
        error: null,

        // 策略管理
        fetchStrategies: async (params) => {
          set((state) => ({
            loading: { ...state.loading, strategies: true },
            error: null,
          }));

          try {
            const response = await strategyService.getStrategies(params);
            set((state) => ({
              strategies: response.strategies,
              loading: { ...state.loading, strategies: false },
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to fetch strategies',
              loading: { ...state.loading, strategies: false },
            }));
          }
        },

        createStrategy: async (strategy) => {
          try {
            const created = await strategyService.createStrategy(strategy);
            set((state) => ({
              strategies: [created, ...state.strategies],
              selectedStrategy: created,
            }));
            return created.id;
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to create strategy',
            }));
            throw error;
          }
        },

        updateStrategy: async (id, strategy) => {
          try {
            const updated = await strategyService.updateStrategy(id, strategy);
            set((state) => ({
              strategies: state.strategies.map((s) => (s.id === id ? updated : s)),
              selectedStrategy: state.selectedStrategy?.id === id ? updated : state.selectedStrategy,
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to update strategy',
            }));
            throw error;
          }
        },

        deleteStrategy: async (id) => {
          try {
            await strategyService.deleteStrategy(id);
            set((state) => ({
              strategies: state.strategies.filter((s) => s.id !== id),
              selectedStrategy: state.selectedStrategy?.id === id ? null : state.selectedStrategy,
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to delete strategy',
            }));
            throw error;
          }
        },

        selectStrategy: (strategy) => {
          set({ selectedStrategy: strategy });
        },

        cloneStrategy: async (id, name) => {
          try {
            const cloned = await strategyService.cloneStrategy(id, name);
            set((state) => ({
              strategies: [cloned, ...state.strategies],
            }));
            return cloned.id;
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to clone strategy',
            }));
            throw error;
          }
        },

        // 策略控制
        startStrategy: async (id) => {
          try {
            await strategyService.startStrategy(id);
            set((state) => ({
              strategies: state.strategies.map((s) =>
                s.id === id ? { ...s, status: 'ACTIVE' as StrategyStatus } : s
              ),
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to start strategy',
            }));
            throw error;
          }
        },

        stopStrategy: async (id) => {
          try {
            await strategyService.stopStrategy(id);
            set((state) => ({
              strategies: state.strategies.map((s) =>
                s.id === id ? { ...s, status: 'STOPPED' as StrategyStatus } : s
              ),
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to stop strategy',
            }));
            throw error;
          }
        },

        pauseStrategy: async (id) => {
          try {
            await strategyService.pauseStrategy(id);
            set((state) => ({
              strategies: state.strategies.map((s) =>
                s.id === id ? { ...s, status: 'PAUSED' as StrategyStatus } : s
              ),
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to pause strategy',
            }));
            throw error;
          }
        },

        // 模板管理
        fetchTemplates: async (params) => {
          set((state) => ({
            loading: { ...state.loading, templates: true },
            error: null,
          }));

          try {
            const templates = await strategyService.getTemplates(params);
            set((state) => ({
              templates,
              loading: { ...state.loading, templates: false },
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to fetch templates',
              loading: { ...state.loading, templates: false },
            }));
          }
        },

        selectTemplate: (template) => {
          set({ selectedTemplate: template });
        },

        createFromTemplate: async (templateId, customization) => {
          try {
            const strategy = await strategyService.createStrategyFromTemplate(
              templateId,
              customization
            );
            set((state) => ({
              strategies: [strategy, ...state.strategies],
              selectedStrategy: strategy,
            }));
            return strategy.id;
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to create from template',
            }));
            throw error;
          }
        },

        // 编辑器
        initializeEditor: (strategy) => {
          set({
            editorState: {
              ...initialEditorState,
              strategy: strategy ? { ...initialEditorState.strategy, ...strategy } : { ...initialEditorState.strategy },
              isDirty: false,
            },
          });
        },

        updateEditorStrategy: (updates) => {
          set((state) => ({
            editorState: {
              ...state.editorState,
              strategy: { ...state.editorState.strategy, ...updates },
              isDirty: true,
            },
          }));
        },

        addCondition: (condition) => {
          set((state) => ({
            editorState: {
              ...state.editorState,
              strategy: {
                ...state.editorState.strategy,
                conditions: [...(state.editorState.strategy.conditions || []), condition],
              },
              isDirty: true,
            },
          }));
        },

        updateCondition: (index, condition) => {
          set((state) => {
            const conditions = [...(state.editorState.strategy.conditions || [])];
            conditions[index] = condition;
            return {
              editorState: {
                ...state.editorState,
                strategy: {
                  ...state.editorState.strategy,
                  conditions,
                },
                isDirty: true,
              },
            };
          });
        },

        removeCondition: (index) => {
          set((state) => {
            const conditions = [...(state.editorState.strategy.conditions || [])];
            conditions.splice(index, 1);
            return {
              editorState: {
                ...state.editorState,
                strategy: {
                  ...state.editorState.strategy,
                  conditions,
                },
                isDirty: true,
              },
            };
          });
        },

        reorderConditions: (fromIndex, toIndex) => {
          set((state) => {
            const conditions = [...(state.editorState.strategy.conditions || [])];
            const [removed] = conditions.splice(fromIndex, 1);
            conditions.splice(toIndex, 0, removed);
            return {
              editorState: {
                ...state.editorState,
                strategy: {
                  ...state.editorState.strategy,
                  conditions,
                },
                isDirty: true,
              },
            };
          });
        },

        validateStrategy: async () => {
          const { editorState } = get();
          
          set((state) => ({
            editorState: {
              ...state.editorState,
              isValidating: true,
              validationErrors: [],
            },
          }));

          try {
            const result = await strategyService.validateStrategy(editorState.strategy);
            set((state) => ({
              editorState: {
                ...state.editorState,
                isValidating: false,
                validationErrors: result.errors,
              },
            }));
          } catch (error) {
            set((state) => ({
              editorState: {
                ...state.editorState,
                isValidating: false,
                validationErrors: ['Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
              },
            }));
          }
        },

        resetEditor: () => {
          set({ editorState: { ...initialEditorState } });
        },

        // 回测
        runBacktest: async (request) => {
          set((state) => ({
            loading: { ...state.loading, backtest: true },
            error: null,
          }));

          try {
            const { backtestId } = await strategyService.runBacktest(request);
            set((state) => {
              const newRunning = new Map(state.runningBacktests);
              newRunning.set(backtestId, { status: 'RUNNING', progress: 0 });
              return {
                runningBacktests: newRunning,
                loading: { ...state.loading, backtest: false },
              };
            });
            return backtestId;
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to run backtest',
              loading: { ...state.loading, backtest: false },
            }));
            throw error;
          }
        },

        fetchBacktestResult: async (id) => {
          try {
            const result = await strategyService.getBacktestResult(id);
            set((state) => ({
              backtestResults: [...state.backtestResults.filter(r => r.id !== id), result],
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to fetch backtest result',
            }));
          }
        },

        fetchStrategyBacktests: async (strategyId) => {
          try {
            const results = await strategyService.getStrategyBacktests(strategyId);
            set((state) => ({
              backtestResults: results,
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to fetch strategy backtests',
            }));
          }
        },

        // 信号管理
        fetchSignals: async (strategyId, params) => {
          set((state) => ({
            loading: { ...state.loading, signals: true },
            error: null,
          }));

          try {
            let signals;
            if (strategyId) {
              signals = await strategyService.getStrategySignals(strategyId, params);
            } else {
              signals = await strategyService.getLatestSignals(params?.limit || 20);
            }
            
            set((state) => ({
              signals,
              loading: { ...state.loading, signals: false },
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to fetch signals',
              loading: { ...state.loading, signals: false },
            }));
          }
        },

        connectSignalWebSocket: () => {
          const { signalWebSocket } = get();
          
          if (signalWebSocket?.readyState === WebSocket.OPEN) {
            return;
          }

          const ws = strategyService.createSignalWebSocket((signal) => {
            set((state) => ({
              signals: [signal, ...state.signals].slice(0, 100), // 保持最近100条信号
            }));
          });

          if (ws) {
            set({ signalWebSocket: ws });
          }
        },

        disconnectSignalWebSocket: () => {
          const { signalWebSocket } = get();
          
          if (signalWebSocket) {
            signalWebSocket.close();
            set({ signalWebSocket: null });
          }
        },

        // 性能数据
        fetchPerformance: async (strategyId, period = '1M') => {
          try {
            const performance = await strategyService.getStrategyPerformance(strategyId, period);
            set((state) => {
              const newPerformanceData = new Map(state.performanceData);
              newPerformanceData.set(`${strategyId}-${period}`, performance);
              return { performanceData: newPerformanceData };
            });
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to fetch performance data',
            }));
          }
        },

        // 策略市场
        fetchPublicStrategies: async (params) => {
          try {
            const response = await strategyService.getPublicStrategies(params);
            set({ publicStrategies: response.strategies });
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to fetch public strategies',
            }));
          }
        },

        publishStrategy: async (id) => {
          try {
            await strategyService.publishStrategy(id);
            set((state) => ({
              strategies: state.strategies.map((s) =>
                s.id === id ? { ...s, isPublic: true } : s
              ),
            }));
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to publish strategy',
            }));
            throw error;
          }
        },

        subscribeToStrategy: async (id) => {
          try {
            await strategyService.subscribeToStrategy(id);
          } catch (error) {
            set((state) => ({
              error: error instanceof Error ? error.message : 'Failed to subscribe to strategy',
            }));
            throw error;
          }
        },

        // 工具方法
        clearError: () => set({ error: null }),
        
        setLoading: (key, value) => {
          set((state) => ({
            loading: { ...state.loading, [key]: value },
          }));
        },
      }),
      {
        name: 'strategy-store',
        partialize: (state) => ({
          // 只持久化部分状态
          editorState: state.editorState,
          selectedStrategy: state.selectedStrategy,
        }),
      }
    ),
    { name: 'StrategyStore' }
  )
);
