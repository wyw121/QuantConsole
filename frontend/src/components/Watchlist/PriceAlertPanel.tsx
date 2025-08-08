import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Plus,
  Search,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Card, CardBody, CardHeader } from "@/components/UI";
import {
  PriceAlert,
  PriceAlertType,
  SupportedExchange,
  NotificationChannel,
} from "@/types/watchlist";
import { WatchlistAPI } from "@/services/watchlistAPI";

interface PriceAlertPanelProps {
  className?: string;
}

export const PriceAlertPanel: React.FC<PriceAlertPanelProps> = ({
  className = "",
}) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "triggered">(
    "all"
  );
  const [selectedAlerts, setSelectedAlerts] = useState<Set<number>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);

  // 加载价格提醒列表
  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await WatchlistAPI.getPriceAlerts({
        page: 1,
        perPage: 100,
      });

      if (response.success) {
        setAlerts(response.data);
      } else {
        setError("获取价格提醒失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取价格提醒失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // 筛选和排序的提醒列表
  const filteredAndSortedAlerts = useMemo(() => {
    let filtered = alerts.filter((alert) => {
      const matchesSearch = alert.symbol
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      switch (filterStatus) {
        case "active":
          matchesStatus = alert.isActive && !alert.isTriggered;
          break;
        case "triggered":
          matchesStatus = alert.isTriggered;
          break;
      }

      return matchesSearch && matchesStatus;
    });

    // 按创建时间倒序排列，最新的在前面
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }, [alerts, searchTerm, filterStatus]);

  // 处理提醒选择
  const handleAlertSelect = (alertId: number, selected: boolean) => {
    const newSelected = new Set(selectedAlerts);
    if (selected) {
      newSelected.add(alertId);
    } else {
      newSelected.delete(alertId);
    }
    setSelectedAlerts(newSelected);
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedAlerts.size === filteredAndSortedAlerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(filteredAndSortedAlerts.map((a) => a.id)));
    }
  };

  // 删除选中的提醒
  const handleDeleteSelected = async () => {
    if (selectedAlerts.size === 0) return;

    if (!confirm(`确定要删除选中的 ${selectedAlerts.size} 个价格提醒吗？`)) {
      return;
    }

    try {
      await WatchlistAPI.deleteAlertsBatch(Array.from(selectedAlerts));
      await loadAlerts();
      setSelectedAlerts(new Set());
    } catch (error) {
      alert(`删除失败: ${error}`);
    }
  };

  // 启用/禁用选中的提醒
  const handleToggleSelectedStatus = async (isActive: boolean) => {
    if (selectedAlerts.size === 0) return;

    try {
      await WatchlistAPI.toggleAlertsStatus(Array.from(selectedAlerts), isActive);
      await loadAlerts();
      setSelectedAlerts(new Set());
    } catch (error) {
      alert(`更新状态失败: ${error}`);
    }
  };

  // 删除单个提醒
  const handleDeleteAlert = async (alertId: number) => {
    if (!confirm("确定要删除这个价格提醒吗？")) {
      return;
    }

    try {
      await WatchlistAPI.deletePriceAlert(alertId);
      await loadAlerts();
    } catch (error) {
      alert(`删除失败: ${error}`);
    }
  };

  // 切换提醒状态
  const handleToggleAlert = async (alertId: number, isActive: boolean) => {
    try {
      await WatchlistAPI.updatePriceAlert(alertId, { isActive });
      await loadAlerts();
    } catch (error) {
      alert(`更新状态失败: ${error}`);
    }
  };

  // 获取提醒类型显示文本
  const getAlertTypeText = (type: PriceAlertType): string => {
    switch (type) {
      case PriceAlertType.PriceAbove:
        return "价格突破";
      case PriceAlertType.PriceBelow:
        return "价格跌破";
      case PriceAlertType.PercentageChange:
        return "价格变动";
      case PriceAlertType.VolumeSpike:
        return "交易量异常";
      case PriceAlertType.TechnicalIndicator:
        return "技术指标";
      default:
        return "未知类型";
    }
  };

  // 获取提醒类型图标
  const getAlertTypeIcon = (type: PriceAlertType) => {
    switch (type) {
      case PriceAlertType.PriceAbove:
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case PriceAlertType.PriceBelow:
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  // 获取提醒状态颜色
  const getStatusColor = (alert: PriceAlert): string => {
    if (alert.isTriggered) return "text-red-400";
    if (alert.isActive) return "text-green-400";
    return "text-gray-400";
  };

  // 获取提醒状态文本
  const getStatusText = (alert: PriceAlert): string => {
    if (alert.isTriggered) return "已触发";
    if (alert.isActive) return "监控中";
    return "已暂停";
  };

  // 获取提醒状态图标
  const getStatusIcon = (alert: PriceAlert) => {
    if (alert.isTriggered) return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (alert.isActive) return <CheckCircle className="w-4 h-4 text-green-400" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  // 格式化价格
  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  // 格式化时间
  const formatTime = (dateStr: string): string => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">加载价格提醒...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">❌ {error}</div>
            <Button onClick={loadAlerts} variant="primary" size="sm">
              重试
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* 搜索和筛选栏 */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索代币符号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* 状态筛选 */}
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
              >
                <option value="all">所有提醒</option>
                <option value="active">监控中</option>
                <option value="triggered">已触发</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                创建提醒
              </Button>
            </div>
          </div>

          {/* 批量操作 */}
          {selectedAlerts.size > 0 && (
            <div className="mt-4 p-3 bg-dark-700 rounded-lg flex items-center justify-between">
              <span className="text-gray-300">
                已选择 {selectedAlerts.size} 个提醒
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedAlerts(new Set())}
                >
                  取消选择
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleSelectedStatus(true)}
                >
                  启用
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleSelectedStatus(false)}
                >
                  暂停
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 价格提醒列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-100 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              价格提醒 ({filteredAndSortedAlerts.length})
            </h3>
            {alerts.length > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedAlerts.size === filteredAndSortedAlerts.length}
                  onChange={handleSelectAll}
                  className="rounded border-dark-600 bg-dark-800 text-blue-400"
                />
                <span className="text-sm text-gray-400">全选</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {filteredAndSortedAlerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-200 mb-2">
                {alerts.length === 0 ? "暂无价格提醒" : "没有找到匹配的提醒"}
              </h4>
              <p className="text-gray-400 mb-6">
                {alerts.length === 0
                  ? "设置智能价格提醒，第一时间获知重要价格变动"
                  : "尝试调整搜索条件或筛选条件"}
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                创建第一个提醒
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    alert.isTriggered
                      ? "bg-red-950/30 border-red-600/30"
                      : alert.isActive
                      ? "bg-dark-800 border-dark-600 hover:bg-dark-700"
                      : "bg-dark-800/50 border-dark-600/50"
                  }`}
                >
                  <div className="flex items-center">
                    {/* 选择框 */}
                    <input
                      type="checkbox"
                      checked={selectedAlerts.has(alert.id)}
                      onChange={(e) =>
                        handleAlertSelect(alert.id, e.target.checked)
                      }
                      className="mr-4 rounded border-dark-600 bg-dark-800 text-blue-400"
                    />

                    {/* 提醒信息 */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getAlertTypeIcon(alert.alertType)}
                            <span className="font-medium text-white">
                              {alert.symbol}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded uppercase">
                              {alert.exchange}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(alert)}
                            <span className={`text-sm font-medium ${getStatusColor(alert)}`}>
                              {getStatusText(alert)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="编辑"
                            className="p-2"
                            onClick={() => setEditingAlert(alert)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={alert.isActive ? "暂停" : "启用"}
                            className="p-2"
                            onClick={() => handleToggleAlert(alert.id, !alert.isActive)}
                          >
                            {alert.isActive ? (
                              <Clock className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="删除"
                            className="p-2 text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">提醒类型:</span>
                          <div className="font-mono text-white">
                            {getAlertTypeText(alert.alertType)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">目标价格:</span>
                          <div className="font-mono text-white">
                            ${formatPrice(alert.targetValue)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">创建时间:</span>
                          <div className="text-gray-300">
                            {formatTime(alert.createdAt)}
                          </div>
                        </div>
                        {alert.triggeredAt && (
                          <div>
                            <span className="text-gray-400">触发时间:</span>
                            <div className="text-red-400">
                              {formatTime(alert.triggeredAt)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 通知渠道 */}
                      {alert.notificationChannels && alert.notificationChannels.length > 0 && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-xs text-gray-400">通知方式:</span>
                          {alert.notificationChannels.map((channel, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-gray-600/20 text-gray-300 rounded"
                            >
                              {channel === "email" ? "邮件" :
                               channel === "in_app" ? "站内" :
                               channel === "web_push" ? "推送" :
                               channel === "webhook" ? "Webhook" : channel}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 创建提醒模态框 */}
      {showCreateModal && (
        <CreateAlertModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadAlerts}
        />
      )}

      {/* 编辑提醒模态框 */}
      {editingAlert && (
        <EditAlertModal
          alert={editingAlert}
          isOpen={!!editingAlert}
          onClose={() => setEditingAlert(null)}
          onSuccess={loadAlerts}
        />
      )}
    </div>
  );
};

// 创建提醒模态框组件
interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [symbol, setSymbol] = useState("");
  const [exchange, setExchange] = useState<SupportedExchange>(
    SupportedExchange.Binance
  );
  const [alertType, setAlertType] = useState<PriceAlertType>(
    PriceAlertType.PriceAbove
  );
  const [targetValue, setTargetValue] = useState("");
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([
    NotificationChannel.InApp,
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol.trim()) {
      alert("请输入代币符号");
      return;
    }

    if (!targetValue.trim() || parseFloat(targetValue) <= 0) {
      alert("请输入有效的目标价格");
      return;
    }

    try {
      setLoading(true);
      await WatchlistAPI.createPriceAlert({
        symbol: symbol.trim().toUpperCase(),
        exchange,
        alertType,
        targetValue: parseFloat(targetValue),
        notificationChannels: notificationChannels.map(channel => channel as string),
      });

      onSuccess();
      onClose();
      // 重置表单
      setSymbol("");
      setTargetValue("");
      setNotificationChannels([NotificationChannel.InApp]);
    } catch (error) {
      alert(`创建提醒失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (channel: NotificationChannel) => {
    setNotificationChannels(prev => {
      if (prev.includes(channel)) {
        return prev.filter(c => c !== channel);
      } else {
        return [...prev, channel];
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-white mb-4">创建价格提醒</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              代币符号 *
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="例如: BTC, ETH, SOL"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              交易所
            </label>
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value as SupportedExchange)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
            >
              <option value={SupportedExchange.Binance}>Binance</option>
              <option value={SupportedExchange.OKX}>OKX</option>
              <option value={SupportedExchange.Huobi}>Huobi</option>
              <option value={SupportedExchange.Coinbase}>Coinbase</option>
              <option value={SupportedExchange.Kraken}>Kraken</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              提醒类型
            </label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as PriceAlertType)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
            >
              <option value={PriceAlertType.PriceAbove}>价格突破</option>
              <option value={PriceAlertType.PriceBelow}>价格跌破</option>
              <option value={PriceAlertType.PercentageChange}>价格变动</option>
              <option value={PriceAlertType.VolumeSpike}>交易量异常</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              目标价格 (USD) *
            </label>
            <input
              type="number"
              step="0.000001"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="输入目标价格"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              通知方式
            </label>
            <div className="space-y-2">
              {Object.values(NotificationChannel).map((channel) => (
                <label
                  key={channel}
                  className="flex items-center space-x-3 text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={notificationChannels.includes(channel)}
                    onChange={() => handleChannelToggle(channel)}
                    className="rounded border-dark-600 bg-dark-700 text-blue-400"
                  />
                  <span>
                    {channel === NotificationChannel.Email
                      ? "邮件通知"
                      : channel === NotificationChannel.InApp
                      ? "站内通知"
                      : channel === NotificationChannel.WebPush
                      ? "浏览器推送"
                      : "Webhook"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "创建中..." : "创建提醒"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 编辑提醒模态框组件
interface EditAlertModalProps {
  alert: PriceAlert;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAlertModal: React.FC<EditAlertModalProps> = ({
  alert,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [targetValue, setTargetValue] = useState(alert.targetValue.toString());
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>(
    (alert.notificationChannels || []).map(c => c as NotificationChannel)
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetValue.trim() || parseFloat(targetValue) <= 0) {
      window.alert("请输入有效的目标价格");
      return;
    }

    try {
      setLoading(true);
      await WatchlistAPI.updatePriceAlert(alert.id, {
        targetValue: parseFloat(targetValue),
        notificationChannels: notificationChannels.map(channel => channel as string),
      });

      onSuccess();
      onClose();
    } catch (error) {
      window.alert(`更新提醒失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (channel: NotificationChannel) => {
    setNotificationChannels(prev => {
      if (prev.includes(channel)) {
        return prev.filter(c => c !== channel);
      } else {
        return [...prev, channel];
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-white mb-4">
          编辑价格提醒 - {alert.symbol}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              目标价格 (USD) *
            </label>
            <input
              type="number"
              step="0.000001"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="输入目标价格"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              通知方式
            </label>
            <div className="space-y-2">
              {Object.values(NotificationChannel).map((channel) => (
                <label
                  key={channel}
                  className="flex items-center space-x-3 text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={notificationChannels.includes(channel)}
                    onChange={() => handleChannelToggle(channel)}
                    className="rounded border-dark-600 bg-dark-700 text-blue-400"
                  />
                  <span>
                    {channel === NotificationChannel.Email
                      ? "邮件通知"
                      : channel === NotificationChannel.InApp
                      ? "站内通知"
                      : channel === NotificationChannel.WebPush
                      ? "浏览器推送"
                      : "Webhook"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "更新中..." : "更新提醒"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
