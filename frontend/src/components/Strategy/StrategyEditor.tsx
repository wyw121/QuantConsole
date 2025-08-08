import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Target,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/UI';
import {
  TechnicalIndicatorType,
  ConditionOperator,
  LogicGate,
  StrategyCondition,
  StrategyType,
} from '@/types/strategy';
import { useStrategyStore } from '@/store/strategy';

const INDICATOR_CONFIGS = {
  SMA: { name: '简单移动平均线', category: 'TREND', color: '#3B82F6' },
  EMA: { name: '指数移动平均线', category: 'TREND', color: '#6366F1' },
  RSI: { name: '相对强弱指数', category: 'MOMENTUM', color: '#8B5CF6' },
  MACD: { name: 'MACD', category: 'MOMENTUM', color: '#A855F7' },
  BOLLINGER: { name: '布林带', category: 'VOLATILITY', color: '#EC4899' },
  STOCHASTIC: { name: '随机指标', category: 'MOMENTUM', color: '#EF4444' },
  ATR: { name: '平均真实范围', category: 'VOLATILITY', color: '#F97316' },
  VOLUME: { name: '成交量', category: 'VOLUME', color: '#84CC16' },
  PRICE: { name: '价格', category: 'PRICE', color: '#10B981' },
  VOLATILITY: { name: '波动率', category: 'VOLATILITY', color: '#06B6D4' },
};

const OPERATOR_LABELS = {
  GT: '大于',
  LT: '小于',
  EQ: '等于',
  GTE: '大于等于',
  LTE: '小于等于',
  CROSS_UP: '向上穿越',
  CROSS_DOWN: '向下穿越',
  BETWEEN: '介于之间',
  OUTSIDE: '超出范围',
};

const STRATEGY_TYPES = {
  TREND_FOLLOWING: '趋势跟踪',
  MEAN_REVERSION: '均值回归',
  BREAKOUT: '突破策略',
  ARBITRAGE: '套利策略',
  SCALPING: '剥头皮',
  SWING_TRADING: '摆动交易',
  CUSTOM: '自定义',
};

// 条件卡片组件
const ConditionCard: React.FC<{
  condition: StrategyCondition;
  index: number;
  onUpdate: (index: number, condition: StrategyCondition) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  totalConditions: number;
}> = ({ condition, index, onUpdate, onRemove, onMoveUp, onMoveDown, totalConditions }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCondition, setEditedCondition] = useState(condition);

  const handleSave = useCallback(() => {
    onUpdate(index, editedCondition);
    setIsEditing(false);
  }, [index, editedCondition, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditedCondition(condition);
    setIsEditing(false);
  }, [condition]);

  const indicatorConfig = INDICATOR_CONFIGS[condition.indicator];

  return (
    <div className="bg-dark-700 rounded-lg border-2 border-dark-600 hover:border-dark-500 transition-all duration-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: indicatorConfig?.color || '#6B7280' }}
            />
            <span className="font-medium text-gray-200">
              {indicatorConfig?.name || condition.indicator}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveUp(index)}
                disabled={index === 0}
                className="text-gray-400 hover:text-gray-200 h-6 w-6 p-0"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveDown(index)}
                disabled={index === totalConditions - 1}
                className="text-gray-400 hover:text-gray-200 h-6 w-6 p-0"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-gray-400 hover:text-gray-200"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-gray-400 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  指标
                </label>
                <select
                  value={editedCondition.indicator}
                  onChange={(e) =>
                    setEditedCondition({
                      ...editedCondition,
                      indicator: e.target.value as TechnicalIndicatorType,
                    })
                  }
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200 text-sm"
                >
                  {Object.entries(INDICATOR_CONFIGS).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  操作符
                </label>
                <select
                  value={editedCondition.operator}
                  onChange={(e) =>
                    setEditedCondition({
                      ...editedCondition,
                      operator: e.target.value as ConditionOperator,
                    })
                  }
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200 text-sm"
                >
                  {Object.entries(OPERATOR_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  目标值
                </label>
                <input
                  type="number"
                  value={typeof editedCondition.value === 'number' ? editedCondition.value : ''}
                  onChange={(e) =>
                    setEditedCondition({
                      ...editedCondition,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200 text-sm"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  周期
                </label>
                <input
                  type="number"
                  value={editedCondition.period || 14}
                  onChange={(e) =>
                    setEditedCondition({
                      ...editedCondition,
                      period: parseInt(e.target.value) || 14,
                    })
                  }
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200 text-sm"
                  min="1"
                />
              </div>
            </div>

            {index < totalConditions - 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  逻辑关系
                </label>
                <select
                  value={editedCondition.logicGate || 'AND'}
                  onChange={(e) =>
                    setEditedCondition({
                      ...editedCondition,
                      logicGate: e.target.value as LogicGate,
                    })
                  }
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200 text-sm"
                >
                  <option value="AND">AND (且)</option>
                  <option value="OR">OR (或)</option>
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-200"
              >
                取消
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                className="bg-purple-600 hover:bg-purple-700"
              >
                保存
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <span>{OPERATOR_LABELS[condition.operator]}</span>
              <span className="font-semibold text-white">{condition.value.toString()}</span>
              {condition.period && (
                <span className="text-gray-400">({condition.period}期)</span>
              )}
            </div>
            {index < totalConditions - 1 && condition.logicGate && (
              <div className="flex items-center">
                <div className="bg-dark-600 px-2 py-1 rounded text-xs font-medium">
                  {condition.logicGate === 'AND' ? '且' : '或'}
                </div>
                <ArrowUpDown className="w-3 h-3 ml-2 text-gray-500" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 指标选择器组件
const IndicatorSelector: React.FC<{
  onSelect: (indicatorType: TechnicalIndicatorType) => void;
}> = ({ onSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'TREND', 'MOMENTUM', 'VOLATILITY', 'VOLUME', 'PRICE'];

  const filteredIndicators = useMemo(() => {
    return Object.entries(INDICATOR_CONFIGS).filter(([, config]) =>
      selectedCategory === 'ALL' || config.category === selectedCategory
    );
  }, [selectedCategory]);

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-purple-600 text-white'
                : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
            }`}
          >
            {category === 'ALL' ? '全部' : category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {filteredIndicators.map(([key, config]) => (
          <button
            key={key}
            onClick={() => onSelect(key as TechnicalIndicatorType)}
            className="flex items-center space-x-2 p-2 bg-dark-600 hover:bg-dark-500 rounded-md text-left transition-colors"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="text-sm text-gray-200">{config.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 主策略编辑器组件
export const StrategyEditor: React.FC = () => {
  const {
    editorState,
    updateEditorStrategy,
    addCondition,
    updateCondition,
    removeCondition,
    reorderConditions,
    validateStrategy,
    createStrategy,
    updateStrategy,
    selectedStrategy,
  } = useStrategyStore();

  const [showIndicatorSelector, setShowIndicatorSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 验证策略
  useEffect(() => {
    if (editorState.isDirty && editorState.strategy.conditions?.length) {
      const timer = setTimeout(() => {
        validateStrategy();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editorState.strategy.conditions, editorState.isDirty, validateStrategy]);

  const handleAddCondition = useCallback((indicatorType: TechnicalIndicatorType) => {
    const newCondition: StrategyCondition = {
      id: `condition-${Date.now()}`,
      indicator: indicatorType,
      operator: 'GT',
      value: 0,
      period: 14,
      logicGate: 'AND',
    };
    addCondition(newCondition);
    setShowIndicatorSelector(false);
  }, [addCondition]);

  const handleMoveConditionUp = useCallback((index: number) => {
    if (index > 0) {
      reorderConditions(index, index - 1);
    }
  }, [reorderConditions]);

  const handleMoveConditionDown = useCallback((index: number) => {
    const conditions = editorState.strategy.conditions || [];
    if (index < conditions.length - 1) {
      reorderConditions(index, index + 1);
    }
  }, [editorState.strategy.conditions, reorderConditions]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await validateStrategy();
      
      if (editorState.validationErrors.length > 0) {
        throw new Error('策略验证失败，请检查配置');
      }

      if (selectedStrategy) {
        await updateStrategy(selectedStrategy.id, editorState.strategy);
      } else {
        await createStrategy(editorState.strategy);
      }
    } catch (error) {
      console.error('保存策略失败:', error);
      alert(error instanceof Error ? error.message : '保存策略失败');
    } finally {
      setIsSaving(false);
    }
  }, [editorState, selectedStrategy, validateStrategy, createStrategy, updateStrategy]);

  const isValid = editorState.validationErrors.length === 0;

  return (
    <div className="space-y-6">
      {/* 策略基本信息 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-100">策略基本信息</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                策略名称 *
              </label>
              <input
                type="text"
                value={editorState.strategy.name || ''}
                onChange={(e) => updateEditorStrategy({ name: e.target.value })}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
                placeholder="输入策略名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                策略类型
              </label>
              <select
                value={editorState.strategy.type || 'CUSTOM'}
                onChange={(e) =>
                  updateEditorStrategy({ type: e.target.value as StrategyType })
                }
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
              >
                {Object.entries(STRATEGY_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                交易对 *
              </label>
              <input
                type="text"
                value={editorState.strategy.symbol || ''}
                onChange={(e) => updateEditorStrategy({ symbol: e.target.value })}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
                placeholder="例如: BTCUSDT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                时间周期
              </label>
              <select
                value={editorState.strategy.timeframe || '1h'}
                onChange={(e) => updateEditorStrategy({ timeframe: e.target.value })}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
              >
                <option value="1m">1分钟</option>
                <option value="5m">5分钟</option>
                <option value="15m">15分钟</option>
                <option value="30m">30分钟</option>
                <option value="1h">1小时</option>
                <option value="4h">4小时</option>
                <option value="1d">1天</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              策略描述
            </label>
            <textarea
              value={editorState.strategy.description || ''}
              onChange={(e) => updateEditorStrategy({ description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
              placeholder="描述您的交易策略..."
            />
          </div>
        </CardBody>
      </Card>

      {/* 策略条件编辑器 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-100">策略条件</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowIndicatorSelector(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加条件
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {editorState.strategy.conditions?.length ? (
            <div className="space-y-4">
              {editorState.strategy.conditions.map((condition, index) => (
                <ConditionCard
                  key={condition.id}
                  condition={condition}
                  index={index}
                  onUpdate={updateCondition}
                  onRemove={removeCondition}
                  onMoveUp={handleMoveConditionUp}
                  onMoveDown={handleMoveConditionDown}
                  totalConditions={editorState.strategy.conditions?.length || 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-200 mb-2">
                暂无条件
              </h4>
              <p className="text-gray-400 mb-4">添加您的第一个策略条件</p>
              <Button
                variant="primary"
                onClick={() => setShowIndicatorSelector(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加条件
              </Button>
            </div>
          )}

          {/* 验证状态 */}
          {editorState.isValidating && (
            <div className="mt-4 flex items-center space-x-2 text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent" />
              <span className="text-sm">正在验证策略...</span>
            </div>
          )}

          {!editorState.isValidating && editorState.validationErrors.length > 0 && (
            <div className="mt-4 space-y-2">
              {editorState.validationErrors.map((error, index) => (
                <div key={index} className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              ))}
            </div>
          )}

          {!editorState.isValidating && isValid && editorState.strategy.conditions?.length && (
            <div className="mt-4 flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">策略验证通过</span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 风险管理 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-100">风险管理</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                止损 (%)
              </label>
              <input
                type="number"
                value={editorState.strategy.riskManagement?.stopLoss || ''}
                onChange={(e) =>
                  updateEditorStrategy({
                    riskManagement: {
                      ...editorState.strategy.riskManagement,
                      stopLoss: parseFloat(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
                step="0.1"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                止盈 (%)
              </label>
              <input
                type="number"
                value={editorState.strategy.riskManagement?.takeProfit || ''}
                onChange={(e) =>
                  updateEditorStrategy({
                    riskManagement: {
                      ...editorState.strategy.riskManagement,
                      takeProfit: parseFloat(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
                step="0.1"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                最大仓位 (%)
              </label>
              <input
                type="number"
                value={editorState.strategy.riskManagement?.maxPositionSize || ''}
                onChange={(e) =>
                  updateEditorStrategy({
                    riskManagement: {
                      ...editorState.strategy.riskManagement,
                      maxPositionSize: parseFloat(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
                step="0.1"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                每日交易次数
              </label>
              <input
                type="number"
                value={editorState.strategy.riskManagement?.maxDailyTrades || ''}
                onChange={(e) =>
                  updateEditorStrategy({
                    riskManagement: {
                      ...editorState.strategy.riskManagement,
                      maxDailyTrades: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
                min="1"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-3">
        <Button variant="ghost" className="text-gray-400 hover:text-gray-200">
          取消
        </Button>
        <Button
          variant="secondary"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!isValid || isSaving}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          运行回测
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              保存中...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              保存策略
            </>
          )}
        </Button>
      </div>

      {/* 指标选择器模态框 */}
      {showIndicatorSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-100">选择技术指标</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIndicatorSelector(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </Button>
            </div>
            <IndicatorSelector onSelect={handleAddCondition} />
          </div>
        </div>
      )}
    </div>
  );
};
