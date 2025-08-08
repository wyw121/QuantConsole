import React, { useState, useEffect, useMemo } from "react";
import {
  Eye,
  Plus,
  Search,
  Trash2,
  BarChart3,
  Bell,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Card, CardBody, CardHeader } from "@/components/UI";
import { WatchlistToken, SupportedExchange } from "@/types/watchlist";
import { WatchlistAPI } from "@/services/watchlistAPI";

interface TokenWatchListProps {
  className?: string;
}

export const TokenWatchList: React.FC<TokenWatchListProps> = ({
  className = "",
}) => {
  const [tokens, setTokens] = useState<WatchlistToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExchange, setSelectedExchange] =
    useState<SupportedExchange | "all">("all");
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "change" | "volume" | "order"
  >("order");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedTokens, setSelectedTokens] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  // 加载关注列表
  const loadWatchlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await WatchlistAPI.getWatchlistTokens({
        page: 1,
        perPage: 100,
        isActive: true,
      });

      if (response.success) {
        setTokens(response.data);
      } else {
        setError("获取关注列表失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取关注列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  // 筛选和排序的代币列表
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens.filter((token) => {
      const matchesSearch = token.symbol
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesExchange =
        selectedExchange === "all" || token.exchange === selectedExchange;
      return matchesSearch && matchesExchange;
    });

    // 排序
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case "name":
          compareValue = a.symbol.localeCompare(b.symbol);
          break;
        case "price":
          compareValue = (a.currentPrice || 0) - (b.currentPrice || 0);
          break;
        case "change":
          compareValue =
            (a.priceChangePercentage24h || 0) -
            (b.priceChangePercentage24h || 0);
          break;
        case "volume":
          compareValue = (a.volume24h || 0) - (b.volume24h || 0);
          break;
        case "order":
        default:
          compareValue = a.sortOrder - b.sortOrder;
          break;
      }

      return sortDirection === "desc" ? -compareValue : compareValue;
    });

    return filtered;
  }, [tokens, searchTerm, selectedExchange, sortBy, sortDirection]);

  // 处理代币选择
  const handleTokenSelect = (tokenId: number, selected: boolean) => {
    const newSelected = new Set(selectedTokens);
    if (selected) {
      newSelected.add(tokenId);
    } else {
      newSelected.delete(tokenId);
    }
    setSelectedTokens(newSelected);
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedTokens.size === filteredAndSortedTokens.length) {
      setSelectedTokens(new Set());
    } else {
      setSelectedTokens(new Set(filteredAndSortedTokens.map((t) => t.id)));
    }
  };

  // 删除选中的代币
  const handleDeleteSelected = async () => {
    if (selectedTokens.size === 0) return;

    if (
      !confirm(`确定要删除选中的 ${selectedTokens.size} 个代币吗？`)
    ) {
      return;
    }

    try {
      await WatchlistAPI.deleteTokensBatch(Array.from(selectedTokens));
      await loadWatchlist();
      setSelectedTokens(new Set());
    } catch (error) {
      alert(`删除失败: ${error}`);
    }
  };

  // 删除单个代币
  const handleDeleteToken = async (tokenId: number) => {
    if (!confirm("确定要从关注列表中删除这个代币吗？")) {
      return;
    }

    try {
      await WatchlistAPI.deleteWatchlistToken(tokenId);
      await loadWatchlist();
    } catch (error) {
      alert(`删除失败: ${error}`);
    }
  };

  // 价格变化颜色
  const getPriceChangeColor = (change: number | undefined): string => {
    if (!change) return "text-gray-400";
    return change >= 0 ? "text-green-400" : "text-red-400";
  };

  // 格式化价格
  const formatPrice = (price: number | undefined): string => {
    if (!price) return "--";
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  // 格式化百分比
  const formatPercentage = (value: number | undefined): string => {
    if (!value) return "--";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // 格式化交易量
  const formatVolume = (volume: number | undefined): string => {
    if (!volume) return "--";
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardBody>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">加载关注列表...</span>
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
            <Button onClick={loadWatchlist} variant="primary" size="sm">
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

            {/* 交易所筛选 */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedExchange}
                onChange={(e) =>
                  setSelectedExchange(e.target.value as SupportedExchange | "all")
                }
                className="px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
              >
                <option value="all">所有交易所</option>
                <option value={SupportedExchange.Binance}>Binance</option>
                <option value={SupportedExchange.OKX}>OKX</option>
                <option value={SupportedExchange.Huobi}>Huobi</option>
                <option value={SupportedExchange.Coinbase}>Coinbase</option>
                <option value={SupportedExchange.Kraken}>Kraken</option>
              </select>

              {/* 排序选择 */}
              <select
                value={`${sortBy}-${sortDirection}`}
                onChange={(e) => {
                  const [sort, direction] = e.target.value.split("-");
                  setSortBy(sort as any);
                  setSortDirection(direction as "asc" | "desc");
                }}
                className="px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
              >
                <option value="order-asc">默认排序</option>
                <option value="name-asc">名称 A-Z</option>
                <option value="name-desc">名称 Z-A</option>
                <option value="price-desc">价格从高到低</option>
                <option value="price-asc">价格从低到高</option>
                <option value="change-desc">涨幅最大</option>
                <option value="change-asc">跌幅最大</option>
                <option value="volume-desc">交易量最大</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加代币
              </Button>
            </div>
          </div>

          {/* 批量操作 */}
          {selectedTokens.size > 0 && (
            <div className="mt-4 p-3 bg-dark-700 rounded-lg flex items-center justify-between">
              <span className="text-gray-300">
                已选择 {selectedTokens.size} 个代币
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedTokens(new Set())}
                >
                  取消选择
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除选中
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 关注列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-100 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              关注列表 ({filteredAndSortedTokens.length})
            </h3>
            {tokens.length > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTokens.size === filteredAndSortedTokens.length}
                  onChange={handleSelectAll}
                  className="rounded border-dark-600 bg-dark-800 text-blue-400"
                />
                <span className="text-sm text-gray-400">全选</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {filteredAndSortedTokens.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-200 mb-2">
                {tokens.length === 0 ? "暂无关注代币" : "没有找到匹配的代币"}
              </h4>
              <p className="text-gray-400 mb-6">
                {tokens.length === 0
                  ? "添加您感兴趣的代币到关注列表，实时监控价格变动"
                  : "尝试调整搜索条件或筛选条件"}
              </p>
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加第一个代币
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedTokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  {/* 选择框 */}
                  <input
                    type="checkbox"
                    checked={selectedTokens.has(token.id)}
                    onChange={(e) =>
                      handleTokenSelect(token.id, e.target.checked)
                    }
                    className="mr-4 rounded border-dark-600 bg-dark-800 text-blue-400"
                  />

                  {/* 代币信息 */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    {/* 代币名称和交易所 */}
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-400 font-bold text-sm">
                          {token.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {token.displayName || token.symbol}
                        </div>
                        <div className="text-xs text-gray-400 uppercase">
                          {token.exchange}
                        </div>
                      </div>
                    </div>

                    {/* 当前价格 */}
                    <div className="text-right md:text-left">
                      <div className="font-mono text-white">
                        ${formatPrice(token.currentPrice)}
                      </div>
                      <div className="text-xs text-gray-400">当前价格</div>
                    </div>

                    {/* 24h变化 */}
                    <div className="text-right md:text-left">
                      <div
                        className={`font-mono ${getPriceChangeColor(
                          token.priceChangePercentage24h
                        )}`}
                      >
                        {formatPercentage(token.priceChangePercentage24h)}
                      </div>
                      <div className="text-xs text-gray-400">24h变化</div>
                    </div>

                    {/* 24h交易量 */}
                    <div className="text-right md:text-left">
                      <div className="font-mono text-white">
                        ${formatVolume(token.volume24h)}
                      </div>
                      <div className="text-xs text-gray-400">24h交易量</div>
                    </div>

                    {/* 市值 */}
                    <div className="text-right md:text-left">
                      <div className="font-mono text-white">
                        ${formatVolume(token.marketCap)}
                      </div>
                      <div className="text-xs text-gray-400">市值</div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="查看图表"
                        className="p-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="设置提醒"
                        className="p-2"
                      >
                        <Bell className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="删除"
                        className="p-2 text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteToken(token.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 添加代币模态框 */}
      {showAddModal && (
        <AddTokenModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadWatchlist}
        />
      )}
    </div>
  );
};

// 添加代币模态框组件
interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddTokenModal: React.FC<AddTokenModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [symbol, setSymbol] = useState("");
  const [exchange, setExchange] = useState<SupportedExchange>(
    SupportedExchange.Binance
  );
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol.trim()) {
      alert("请输入代币符号");
      return;
    }

    try {
      setLoading(true);
      await WatchlistAPI.createWatchlistToken({
        symbol: symbol.trim().toUpperCase(),
        exchange,
        displayName: displayName.trim() || undefined,
      });

      onSuccess();
      onClose();
      setSymbol("");
      setDisplayName("");
    } catch (error) {
      alert(`添加失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-white mb-4">添加关注代币</h3>

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
              显示名称 (可选)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="自定义显示名称"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            />
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
              {loading ? "添加中..." : "添加"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
