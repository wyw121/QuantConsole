import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  Square,
  Copy,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/UI';
import { TradingStrategy, StrategyStatus, StrategyType } from '@/types/strategy';
import { useStrategyStore } from '@/store/strategy';

const StrategyStatusBadge: React.FC<{ status: StrategyStatus }> = ({ status }) => {
  const getStatusConfig = (status: StrategyStatus) => {
    switch (status) {
      case 'DRAFT':
        return { color: 'text-gray-400 bg-gray-400/20', label: '草稿', icon: Edit };
      case 'ACTIVE':
        return { color: 'text-green-400 bg-green-400/20', label: '运行中', icon: CheckCircle };
      case 'PAUSED':
        return { color: 'text-yellow-400 bg-yellow-400/20', label: '暂停', icon: Pause };
      case 'STOPPED':
        return { color: 'text-red-400 bg-red-400/20', label: '已停止', icon: Square };
      case 'ERROR':
        return { color: 'text-red-500 bg-red-500/20', label: '错误', icon: AlertCircle };
      default:
        return { color: 'text-gray-400 bg-gray-400/20', label: '未知', icon: AlertCircle };
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

const StrategyTypeTag: React.FC<{ type: StrategyType }> = ({ type }) => {
  const getTypeConfig = (type: StrategyType) => {
    switch (type) {
      case 'TREND_FOLLOWING':
        return { color: 'bg-blue-500/20 text-blue-400', label: '趋势' };
      case 'MEAN_REVERSION':
        return { color: 'bg-purple-500/20 text-purple-400', label: '均值回归' };
      case 'BREAKOUT':
        return { color: 'bg-orange-500/20 text-orange-400', label: '突破' };
      case 'ARBITRAGE':
        return { color: 'bg-green-500/20 text-green-400', label: '套利' };
      case 'SCALPING':
        return { color: 'bg-red-500/20 text-red-400', label: '剥头皮' };
      case 'SWING_TRADING':
        return { color: 'bg-yellow-500/20 text-yellow-400', label: '摆动' };
      default:
        return { color: 'bg-gray-500/20 text-gray-400', label: '自定义' };
    }
  };

  const config = getTypeConfig(type);
  
  return (
    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const StrategyCard: React.FC<{
  strategy: TradingStrategy;
  onSelect: (strategy: TradingStrategy) => void;
  onEdit: (strategy: TradingStrategy) => void;
  onClone: (strategy: TradingStrategy) => void;
  onDelete: (strategy: TradingStrategy) => void;
  onStart: (strategy: TradingStrategy) => void;
  onStop: (strategy: TradingStrategy) => void;
  onPause: (strategy: TradingStrategy) => void;
}> = ({
  strategy,
  onSelect,
  onEdit,
  onClone,
  onDelete,
  onStart,
  onStop,
  onPause,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleActionClick = (action: () => void) => {
    action();
    setShowMenu(false);
  };

  const canStart = strategy.status === 'DRAFT' || strategy.status === 'STOPPED' || strategy.status === 'PAUSED';
  const canPause = strategy.status === 'ACTIVE';
  const canStop = strategy.status === 'ACTIVE' || strategy.status === 'PAUSED';

  return (
    <Card className="hover:border-dark-500 transition-colors cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onSelect(strategy)}>
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-medium text-gray-100 truncate">
                {strategy.name}
              </h3>
              <StrategyStatusBadge status={strategy.status} />
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <StrategyTypeTag type={strategy.type} />
              <span className="text-sm text-gray-400">
                {strategy.symbol} • {strategy.timeframe}
              </span>
            </div>
            <p className="text-sm text-gray-400 line-clamp-2">
              {strategy.description || '暂无描述'}
            </p>
          </div>
          
          <div className="relative ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-200"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-dark-700 border border-dark-600 rounded-md shadow-lg z-10 min-w-32">
                <div className="py-1">
                  <button
                    onClick={() => handleActionClick(() => onEdit(strategy))}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-600 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    编辑
                  </button>
                  <button
                    onClick={() => handleActionClick(() => onClone(strategy))}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-600 flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    克隆
                  </button>
                  {canStart && (
                    <button
                      onClick={() => handleActionClick(() => onStart(strategy))}
                      className="w-full px-3 py-2 text-left text-sm text-green-400 hover:bg-dark-600 flex items-center"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      启动
                    </button>
                  )}
                  {canPause && (
                    <button
                      onClick={() => handleActionClick(() => onPause(strategy))}
                      className="w-full px-3 py-2 text-left text-sm text-yellow-400 hover:bg-dark-600 flex items-center"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      暂停
                    </button>
                  )}
                  {canStop && (
                    <button
                      onClick={() => handleActionClick(() => onStop(strategy))}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-600 flex items-center"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      停止
                    </button>
                  )}
                  <div className="border-t border-dark-600 my-1"></div>
                  <button
                    onClick={() => handleActionClick(() => onDelete(strategy))}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-600 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardBody onClick={() => onSelect(strategy)}>
        {/* 策略统计 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-lg font-semibold ${
              (strategy.avgReturn || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {strategy.avgReturn ? `${strategy.avgReturn > 0 ? '+' : ''}${strategy.avgReturn.toFixed(2)}%` : '--'}
            </div>
            <div className="text-xs text-gray-500">平均收益</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-300">
              {strategy.successRate ? `${strategy.successRate.toFixed(1)}%` : '--'}
            </div>
            <div className="text-xs text-gray-500">成功率</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-300">
              {strategy.totalSignals || 0}
            </div>
            <div className="text-xs text-gray-500">信号数</div>
          </div>
        </div>

        {/* 策略标签 */}
        {strategy.tags && strategy.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {strategy.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex px-2 py-1 rounded text-xs bg-dark-600 text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(strategy.createdAt).toLocaleDateString()}
            </div>
            {strategy.isPublic && strategy.subscribers && (
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {strategy.subscribers} 订阅
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {strategy.lastBacktest && (
              <div className="flex items-center">
                <BarChart3 className="w-3 h-3 mr-1" />
                已回测
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export const StrategyList: React.FC<{
  onCreateNew: () => void;
  onEditStrategy: (strategy: TradingStrategy) => void;
}> = ({ onCreateNew, onEditStrategy }) => {
  const {
    strategies,
    loading,
    error,
    fetchStrategies,
    selectStrategy,
    cloneStrategy,
    deleteStrategy,
    startStrategy,
    stopStrategy,
    pauseStrategy,
  } = useStrategyStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<StrategyType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<StrategyStatus | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // 加载策略列表
  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  // 过滤策略
  const filteredStrategies = strategies.filter((strategy) => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || strategy.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || strategy.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCloneStrategy = useCallback(async (strategy: TradingStrategy) => {
    try {
      const clonedId = await cloneStrategy(strategy.id, `${strategy.name} (副本)`);
      console.log('策略克隆成功:', clonedId);
    } catch (error) {
      console.error('克隆策略失败:', error);
      alert('克隆策略失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, [cloneStrategy]);

  const handleDeleteStrategy = useCallback(async (strategy: TradingStrategy) => {
    if (window.confirm(`确定要删除策略"${strategy.name}"吗？此操作无法撤销。`)) {
      try {
        await deleteStrategy(strategy.id);
      } catch (error) {
        console.error('删除策略失败:', error);
        alert('删除策略失败：' + (error instanceof Error ? error.message : '未知错误'));
      }
    }
  }, [deleteStrategy]);

  const handleStartStrategy = useCallback(async (strategy: TradingStrategy) => {
    try {
      await startStrategy(strategy.id);
    } catch (error) {
      console.error('启动策略失败:', error);
      alert('启动策略失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, [startStrategy]);

  const handleStopStrategy = useCallback(async (strategy: TradingStrategy) => {
    try {
      await stopStrategy(strategy.id);
    } catch (error) {
      console.error('停止策略失败:', error);
      alert('停止策略失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, [stopStrategy]);

  const handlePauseStrategy = useCallback(async (strategy: TradingStrategy) => {
    try {
      await pauseStrategy(strategy.id);
    } catch (error) {
      console.error('暂停策略失败:', error);
      alert('暂停策略失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, [pauseStrategy]);

  if (loading.strategies) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent"></div>
        <span className="ml-2 text-gray-400">加载策略中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-200 mb-2">加载失败</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <Button
          variant="primary"
          onClick={() => fetchStrategies()}
          className="bg-purple-600 hover:bg-purple-700"
        >
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索策略名称、描述、交易对..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200 focus:outline-none focus:border-purple-400"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`${showFilters ? 'text-purple-400' : 'text-gray-400'} hover:text-gray-200`}
          >
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </Button>
          
          <Button
            variant="primary"
            onClick={onCreateNew}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建策略
          </Button>
        </div>
      </div>

      {/* 筛选选项 */}
      {showFilters && (
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  策略类型
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as StrategyType | 'ALL')}
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
                >
                  <option value="ALL">全部类型</option>
                  <option value="TREND_FOLLOWING">趋势跟踪</option>
                  <option value="MEAN_REVERSION">均值回归</option>
                  <option value="BREAKOUT">突破策略</option>
                  <option value="ARBITRAGE">套利策略</option>
                  <option value="SCALPING">剥头皮</option>
                  <option value="SWING_TRADING">摆动交易</option>
                  <option value="CUSTOM">自定义</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  策略状态
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as StrategyStatus | 'ALL')}
                  className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-md text-gray-200"
                >
                  <option value="ALL">全部状态</option>
                  <option value="DRAFT">草稿</option>
                  <option value="ACTIVE">运行中</option>
                  <option value="PAUSED">暂停</option>
                  <option value="STOPPED">已停止</option>
                  <option value="ERROR">错误</option>
                </select>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 策略统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">总策略数</span>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-white">{strategies.length}</div>
        </div>
        
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">运行中</span>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-semibold text-green-400">
            {strategies.filter(s => s.status === 'ACTIVE').length}
          </div>
        </div>
        
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">暂停</span>
            <Pause className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-semibold text-yellow-400">
            {strategies.filter(s => s.status === 'PAUSED').length}
          </div>
        </div>
        
        <div className="bg-dark-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">草稿</span>
            <Edit className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-400">
            {strategies.filter(s => s.status === 'DRAFT').length}
          </div>
        </div>
      </div>

      {/* 策略列表 */}
      {filteredStrategies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStrategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onSelect={selectStrategy}
              onEdit={onEditStrategy}
              onClone={handleCloneStrategy}
              onDelete={handleDeleteStrategy}
              onStart={handleStartStrategy}
              onStop={handleStopStrategy}
              onPause={handlePauseStrategy}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-200 mb-2">
            {searchTerm || filterType !== 'ALL' || filterStatus !== 'ALL' 
              ? '没有找到匹配的策略' 
              : '暂无策略'}
          </h3>
          <p className="text-gray-400 mb-4">
            {searchTerm || filterType !== 'ALL' || filterStatus !== 'ALL'
              ? '尝试调整搜索条件或筛选器'
              : '创建您的第一个交易策略'}
          </p>
          <Button
            variant="primary"
            onClick={onCreateNew}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建策略
          </Button>
        </div>
      )}
    </div>
  );
};
