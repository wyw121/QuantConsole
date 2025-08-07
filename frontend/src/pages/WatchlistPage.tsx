import { Button } from "@/components/Button";
import { Card, CardBody, CardHeader } from "@/components/UI";
import { useAuth } from "@/hooks";
import {
  ArrowUpDown,
  Bell,
  Eye,
  Filter,
  Plus,
  Search,
  Settings,
  Star,
  TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

export const WatchlistPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "watchlist" | "alerts" | "comparison"
  >("watchlist");
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* 顶部导航栏 */}
      <header className="bg-dark-900 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6">
              <Link to="/dashboard">
                <h1 className="text-xl font-bold gradient-text hover:opacity-80 transition-opacity">
                  QuantConsole
                </h1>
              </Link>
              <nav className="flex space-x-4">
                <span className="text-gray-300 font-medium">价格监控</span>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                {user?.username || user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 页面标题 */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-100">
                价格监控中心
              </h2>
              <p className="text-gray-400 mt-1">
                管理关注代币，设置智能提醒，对比多交易所数据
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                disabled
                title="功能开发中"
                className="opacity-50 cursor-not-allowed"
              >
                <Settings className="w-4 h-4 mr-2" />
                监控设置
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled
                title="功能开发中"
                className="opacity-50 cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加监控
              </Button>
            </div>
          </div>

          {/* 功能标签页 */}
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("watchlist")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "watchlist"
                    ? "border-blue-400 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                关注列表
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "alerts"
                    ? "border-blue-400 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                价格提醒
              </button>
              <button
                onClick={() => setActiveTab("comparison")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "comparison"
                    ? "border-blue-400 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <ArrowUpDown className="w-4 h-4 inline mr-2" />
                数据对比
              </button>
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="mt-6">
            {activeTab === "watchlist" && (
              <div className="space-y-6">
                {/* 搜索和过滤 */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索代币..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="功能开发中"
                    className="opacity-50 cursor-not-allowed"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    筛选
                  </Button>
                </div>

                {/* 关注列表 */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-100">
                      我的关注列表
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center py-12">
                      <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-200 mb-2">
                        暂无关注代币
                      </h4>
                      <p className="text-gray-400 mb-6">
                        添加您感兴趣的代币到关注列表，实时监控价格变动
                      </p>
                      <Button
                        variant="primary"
                        disabled
                        title="功能开发中"
                        className="opacity-50 cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        添加第一个代币
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="space-y-6">
                {/* 价格提醒设置 */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-100">
                      价格提醒设置
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-200 mb-2">
                        暂无价格提醒
                      </h4>
                      <p className="text-gray-400 mb-6">
                        设置智能价格提醒，第一时间获知重要价格变动
                      </p>
                      <Button
                        variant="primary"
                        disabled
                        title="功能开发中"
                        className="opacity-50 cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        创建提醒
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === "comparison" && (
              <div className="space-y-6">
                {/* 交易所数据对比 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-100">
                        交易所数据对比
                      </h3>
                      <Link to="/watchlist/comparison">
                        <Button variant="primary" size="sm">
                          进入对比页面
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center py-12">
                      <ArrowUpDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-200 mb-2">
                        多交易所价格对比
                      </h4>
                      <p className="text-gray-400 mb-6">
                        实时对比不同交易所的价格数据，发现套利机会
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-dark-700 rounded-lg p-4">
                          <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            实时价格差异
                          </h5>
                          <p className="text-gray-400 text-xs mt-1">
                            监控交易所间价格差
                          </p>
                        </div>
                        <div className="bg-dark-700 rounded-lg p-4">
                          <Star className="w-6 h-6 text-yellow-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            套利机会提醒
                          </h5>
                          <p className="text-gray-400 text-xs mt-1">
                            发现有利可图的价差
                          </p>
                        </div>
                        <div className="bg-dark-700 rounded-lg p-4">
                          <Eye className="w-6 h-6 text-blue-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            历史数据分析
                          </h5>
                          <p className="text-gray-400 text-xs mt-1">
                            追踪价差变化趋势
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>

          {/* 快速访问卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardBody>
                <div className="flex items-center">
                  <div className="p-3 bg-blue-600/20 rounded-lg mr-4">
                    <Eye className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-100">快速监控</h4>
                    <p className="text-sm text-gray-400">添加代币到关注列表</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="功能开发中"
                    className="opacity-50 cursor-not-allowed"
                  >
                    添加
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardBody>
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-600/20 rounded-lg mr-4">
                    <Bell className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-100">智能提醒</h4>
                    <p className="text-sm text-gray-400">设置价格变动提醒</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="功能开发中"
                    className="opacity-50 cursor-not-allowed"
                  >
                    设置
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardBody>
                <div className="flex items-center">
                  <div className="p-3 bg-green-600/20 rounded-lg mr-4">
                    <ArrowUpDown className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-100">数据对比</h4>
                    <p className="text-sm text-gray-400">多交易所价格对比</p>
                  </div>
                  <Link to="/watchlist/comparison">
                    <Button variant="ghost" size="sm">
                      查看
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
