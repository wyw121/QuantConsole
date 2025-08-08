import React, { useState, useCallback, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/UI';
import { BacktestResult, BacktestRequest, TradingStrategy } from '@/types/strategy';
import { useStrategyStore } from '@/store/strategy';

interface BacktestPanelProps {
  strategy?: TradingStrategy;
}

const BacktestStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { color: 'text-yellow-400 bg-yellow-400/20', label: '等待中', icon: Clock };
      case 'RUNNING':
        return { color: 'text-blue-400 bg-blue-400/20', label: '运行中', icon: Activity };
      case 'COMPLETED':
        return { color: 'text-green-400 bg-green-400/20', label: '已完成', icon: CheckCircle };
      case 'FAILED':
        return { color: 'text-red-400 bg-red-400/20', label: '失败', icon: AlertTriangle };
      default:
        return { color: 'text-gray-400 bg-gray-400/20', label: '未知', icon: AlertTriangle };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </div>
  );
};

const PerformanceMetric: React.FC<{
  label: string;
  value: string | number;
  change?: number;
  format?: 'currency' | 'percentage' | 'number';
  icon?: React.ComponentType<any>;
}> = ({ label, value, change, format = 'number', icon: Icon }) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getChangeColor = (change?: number) => {
    if (change === undefined) return 'text-gray-400';
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getChangeIcon = (change?: number) => {
    if (change === undefined) return null;
    return change >= 0 ? TrendingUp : TrendingDown;
  };

  const ChangeIcon = getChangeIcon(change);

  return (
    <div className="bg-dark-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          <span className="text-sm text-gray-400">{label}</span>
        </div>
        {change !== undefined && ChangeIcon && (
          <div className={`flex items-center space-x-1 ${getChangeColor(change)}`}>
            <ChangeIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{change > 0 ? '+' : ''}{change.toFixed(2)}%</span>
          </div>
        )}
      </div>
      <div className="text-lg font-semibold text-white">
        {formatValue(value)}
      </div>
    </div>
  );
};

export const BacktestPanel: React.FC<BacktestPanelProps> = ({ strategy }) => {
  const {
    backtestResults,
    runningBacktests,
    runBacktest,
    fetchBacktestResult,
    fetchStrategyBacktests,
  } = useStrategyStore();

  const [backtestConfig, setBacktestConfig] = useState<Partial<BacktestRequest>>({
    symbol: strategy?.symbol || 'BTCUSDT',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90天前
    endDate: new Date().toISOString().split('T')[0], // 今天
    initialCapital: 10000,
    timeframe: strategy?.timeframe || '1h',
  });

  const [isRunning, setIsRunning] = useState(false);
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);

  // 获取策略的回测历史
  useEffect(() => {
    if (strategy?.id) {
      fetchStrategyBacktests(strategy.id);
    }
  }, [strategy?.id, fetchStrategyBacktests]);

  // 监控运行中的回测
  useEffect(() => {
    const checkRunningBacktests = async () => {
      for (const [backtestId, status] of runningBacktests) {
        if (status.status === 'RUNNING') {
          try {
            const result = await fetchBacktestResult(backtestId);
            if (result) {
              setIsRunning(false);
            }
          } catch (error) {
            console.error('检查回测状态失败:', error);
          }
        }
      }
    };

    if (runningBacktests.size > 0) {
      const interval = setInterval(checkRunningBacktests, 2000);
      return () => clearInterval(interval);
    }
  }, [runningBacktests, fetchBacktestResult]);

  const handleRunBacktest = useCallback(async () => {
    if (!strategy?.id) {
      alert('请先选择一个策略');
      return;
    }

    try {
      setIsRunning(true);
      
      const request: BacktestRequest = {
        strategyId: strategy.id,
        symbol: backtestConfig.symbol!,
        startDate: backtestConfig.startDate!,
        endDate: backtestConfig.endDate!,
        initialCapital: backtestConfig.initialCapital!,
        timeframe: backtestConfig.timeframe!,
      };

      await runBacktest(request);
      
      alert('回测已开始，请稍后查看结果');
    } catch (error) {
      console.error('启动回测失败:', error);
      alert('启动回测失败：' + (error instanceof Error ? error.message : '未知错误'));
      setIsRunning(false);
    }
  }, [strategy?.id, backtestConfig, runBacktest]);

  const strategyResults = backtestResults.filter(result => result.strategyId === strategy?.id);
  const latestResult = strategyResults[0];

  return (
    <div className="space-y-6">
      {/* 回测配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-100">回测配置</h3>
            <div className="flex items-center space-x-2">
              {isRunning && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent" />
                  <span className="text-sm">回测运行中...</span>
                </div>
              )}
              <Button
                variant="primary"
                onClick={handleRunBacktest}
                disabled={isRunning || !strategy}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? '运行中...' : '开始回测'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                交易对
              </label>
              <input
                type="text"
                value={backtestConfig.symbol || ''}
                onChange={(e) => setBacktestConfig({ ...backtestConfig, symbol: e.target.value })}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
                placeholder="BTCUSDT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                开始日期
              </label>
              <input
                type="date"
                value={backtestConfig.startDate || ''}
                onChange={(e) => setBacktestConfig({ ...backtestConfig, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                结束日期
              </label>
              <input
                type="date"
                value={backtestConfig.endDate || ''}
                onChange={(e) => setBacktestConfig({ ...backtestConfig, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                初始资金 ($)
              </label>
              <input
                type="number"
                value={backtestConfig.initialCapital || ''}
                onChange={(e) => setBacktestConfig({ ...backtestConfig, initialCapital: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
                min="1000"
                step="1000"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              时间周期
            </label>
            <select
              value={backtestConfig.timeframe || '1h'}
              onChange={(e) => setBacktestConfig({ ...backtestConfig, timeframe: e.target.value })}
              className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200 max-w-xs"
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
        </CardBody>
      </Card>

      {/* 最新回测结果概览 */}
      {latestResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-100">最新回测结果</h3>
              <div className="flex items-center space-x-2">
                <BacktestStatusBadge status="COMPLETED" />
                <span className="text-sm text-gray-400">
                  {new Date(latestResult.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <PerformanceMetric
                label="总收益"
                value={latestResult.totalReturn}
                format="percentage"
                icon={TrendingUp}
                change={latestResult.totalReturn}
              />
              <PerformanceMetric
                label="年化收益率"
                value={latestResult.annualizedReturn}
                format="percentage"
                icon={BarChart3}
              />
              <PerformanceMetric
                label="最大回撤"
                value={latestResult.maxDrawdown}
                format="percentage"
                icon={TrendingDown}
              />
              <PerformanceMetric
                label="夏普比率"
                value={latestResult.sharpeRatio.toFixed(2)}
                icon={Activity}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PerformanceMetric
                label="胜率"
                value={latestResult.winRate}
                format="percentage"
                icon={Percent}
              />
              <PerformanceMetric
                label="盈利因子"
                value={latestResult.profitFactor.toFixed(2)}
                icon={DollarSign}
              />
              <PerformanceMetric
                label="交易次数"
                value={latestResult.totalTrades}
                icon={Activity}
              />
              <PerformanceMetric
                label="最终资金"
                value={latestResult.finalCapital}
                format="currency"
                icon={DollarSign}
              />
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedResult(latestResult)}
                className="text-gray-400 hover:text-gray-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                查看详情
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  // TODO: 实现导出功能
                  alert('导出功能正在开发中...');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                导出报告
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 历史回测记录 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-100">历史回测记录</h3>
        </CardHeader>
        <CardBody>
          {strategyResults.length > 0 ? (
            <div className="space-y-3">
              {strategyResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex items-center space-x-4">
                    <BacktestStatusBadge status="COMPLETED" />
                    <div>
                      <div className="font-medium text-gray-200">
                        {result.symbol} • {result.startDate} ~ {result.endDate}
                      </div>
                      <div className="text-sm text-gray-400">
                        初始资金: ${result.initialCapital.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className={`text-sm font-medium ${
                        result.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.totalReturn > 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500">总收益</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-300">
                        {result.winRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">胜率</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-300">
                        {result.totalTrades}
                      </div>
                      <div className="text-xs text-gray-500">交易数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-400">
                        {new Date(result.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">回测日期</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-200 mb-2">暂无回测记录</h4>
              <p className="text-gray-400 mb-4">开始您的第一次策略回测</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 详细回测结果模态框 */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-gray-100">
                回测详细结果 - {selectedResult.symbol}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedResult(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </Button>
            </div>

            {/* 详细性能指标 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">回测期间</div>
                <div className="font-medium text-gray-200">
                  {selectedResult.startDate} ~ {selectedResult.endDate}
                </div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">总交易次数</div>
                <div className="font-medium text-gray-200">{selectedResult.totalTrades}</div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">盈利交易</div>
                <div className="font-medium text-green-400">{selectedResult.winningTrades}</div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">亏损交易</div>
                <div className="font-medium text-red-400">{selectedResult.losingTrades}</div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">平均持仓时间</div>
                <div className="font-medium text-gray-200">
                  {Math.round(selectedResult.avgTradeDuration / 60)}小时
                </div>
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">波动率</div>
                <div className="font-medium text-gray-200">
                  {selectedResult.volatility.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* 交易记录预览 */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-100 mb-4">近期交易记录</h4>
              <div className="bg-dark-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-600">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">日期</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">方向</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-300">入场价</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-300">出场价</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-300">盈亏</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-300">退出原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedResult.trades.slice(0, 10).map((trade, index) => (
                      <tr key={index} className="border-t border-dark-600">
                        <td className="px-4 py-2 text-sm text-gray-300">
                          {new Date(trade.entryDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            trade.side === 'BUY' 
                              ? 'bg-green-400/20 text-green-400' 
                              : 'bg-red-400/20 text-red-400'
                          }`}>
                            {trade.side === 'BUY' ? '做多' : '做空'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-gray-300">
                          ${trade.entryPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-gray-300">
                          ${trade.exitPrice.toFixed(2)}
                        </td>
                        <td className={`px-4 py-2 text-right text-sm font-medium ${
                          trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-400">
                          {trade.exitReason === 'SIGNAL' ? '信号' :
                           trade.exitReason === 'STOP_LOSS' ? '止损' :
                           trade.exitReason === 'TAKE_PROFIT' ? '止盈' : '跟踪止损'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedResult.trades.length > 10 && (
                  <div className="px-4 py-3 bg-dark-600 text-center text-sm text-gray-400">
                    显示前10条记录，共{selectedResult.trades.length}条交易
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  // TODO: 实现导出功能
                  alert('导出功能正在开发中...');
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                导出完整报告
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedResult(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
