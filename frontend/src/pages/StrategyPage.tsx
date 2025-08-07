import { Button } from "@/components/Button";
import { Card, CardBody, CardHeader } from "@/components/UI";
import { useAuth } from "@/hooks";
import {
  BarChart3,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  Search,
  Settings,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

export const StrategyPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"editor" | "backtest" | "market">(
    "editor"
  );

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
                <span className="text-gray-300 font-medium">交易策略</span>
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
                交易策略中心
              </h2>
              <p className="text-gray-400 mt-1">创建、测试和优化您的交易策略</p>
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
                策略设置
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled
                title="功能开发中"
                className="opacity-50 cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                创建策略
              </Button>
            </div>
          </div>

          {/* 功能标签页 */}
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("editor")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "editor"
                    ? "border-purple-400 text-purple-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <Target className="w-4 h-4 inline mr-2" />
                策略编辑器
              </button>
              <button
                onClick={() => setActiveTab("backtest")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "backtest"
                    ? "border-purple-400 text-purple-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                回测系统
              </button>
              <button
                onClick={() => setActiveTab("market")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "market"
                    ? "border-purple-400 text-purple-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                策略市场
              </button>
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="mt-6">
            {activeTab === "editor" && (
              <div className="space-y-6">
                {/* 策略编辑器 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 我的策略列表 */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-100">
                            我的策略
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            title="功能开发中"
                            className="opacity-50 cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="text-center py-8">
                          <Target className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-400 text-sm">暂无策略</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            title="功能开发中"
                            className="opacity-50 cursor-not-allowed mt-3"
                          >
                            创建第一个策略
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* 策略编辑区域 */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-medium text-gray-100">
                          可视化策略编辑器
                        </h3>
                      </CardHeader>
                      <CardBody>
                        <div className="text-center py-12">
                          <div className="bg-dark-700 rounded-lg p-8">
                            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-xl font-medium text-gray-200 mb-3">
                              策略编辑器开发中
                            </h4>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                              即将推出拖拽式策略编辑器，让您轻松创建复杂的交易策略
                            </p>
                            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-sm">
                              <div className="bg-dark-600 rounded p-3">
                                <Zap className="w-5 h-5 text-yellow-400 mb-1" />
                                <p className="text-gray-300">拖拽编辑</p>
                              </div>
                              <div className="bg-dark-600 rounded p-3">
                                <BarChart3 className="w-5 h-5 text-blue-400 mb-1" />
                                <p className="text-gray-300">技术指标</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>

                {/* 策略模板 */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-100">
                      策略模板
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                        <h4 className="font-medium text-gray-100 mb-2">
                          RSI超卖反弹
                        </h4>
                        <p className="text-sm text-gray-400 mb-3">
                          基于RSI指标的超卖反弹策略
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          title="功能开发中"
                          className="opacity-50 cursor-not-allowed w-full"
                        >
                          使用模板
                        </Button>
                      </div>
                      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                        <h4 className="font-medium text-gray-100 mb-2">
                          均线交叉
                        </h4>
                        <p className="text-sm text-gray-400 mb-3">
                          双均线金叉死叉交易策略
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          title="功能开发中"
                          className="opacity-50 cursor-not-allowed w-full"
                        >
                          使用模板
                        </Button>
                      </div>
                      <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                        <h4 className="font-medium text-gray-100 mb-2">
                          布林带突破
                        </h4>
                        <p className="text-sm text-gray-400 mb-3">
                          布林带上下轨突破策略
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          title="功能开发中"
                          className="opacity-50 cursor-not-allowed w-full"
                        >
                          使用模板
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === "backtest" && (
              <div className="space-y-6">
                {/* 回测系统 */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-100">
                      策略回测
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-xl font-medium text-gray-200 mb-3">
                        回测系统开发中
                      </h4>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        完善的回测系统即将上线，验证您的策略在历史数据中的表现
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-sm">
                        <div className="bg-dark-700 rounded-lg p-4">
                          <Clock className="w-6 h-6 text-blue-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            历史数据
                          </h5>
                          <p className="text-gray-400 text-xs">
                            多年历史K线数据
                          </p>
                        </div>
                        <div className="bg-dark-700 rounded-lg p-4">
                          <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            收益分析
                          </h5>
                          <p className="text-gray-400 text-xs">
                            详细的盈亏统计
                          </p>
                        </div>
                        <div className="bg-dark-700 rounded-lg p-4">
                          <BarChart3 className="w-6 h-6 text-purple-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            风险指标
                          </h5>
                          <p className="text-gray-400 text-xs">
                            最大回撤等指标
                          </p>
                        </div>
                        <div className="bg-dark-700 rounded-lg p-4">
                          <CheckCircle className="w-6 h-6 text-yellow-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            策略优化
                          </h5>
                          <p className="text-gray-400 text-xs">参数自动优化</p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === "market" && (
              <div className="space-y-6">
                {/* 策略市场 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-100">
                      策略市场
                    </h3>
                    <p className="text-sm text-gray-400">
                      发现和使用优秀的交易策略
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="搜索策略..."
                        className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
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
                </div>

                <Card>
                  <CardBody>
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-xl font-medium text-gray-200 mb-3">
                        策略市场即将开放
                      </h4>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        策略分享平台正在建设中，您将能够分享和使用社区的优秀策略
                      </p>
                      <div className="text-sm text-gray-400 space-y-2">
                        <p>🔥 热门策略推荐</p>
                        <p>⭐ 策略评分系统</p>
                        <p>💰 策略收益排行</p>
                        <p>🤝 社区交流互动</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>

          {/* 快速入门卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="text-center">
                  <div className="p-3 bg-purple-600/20 rounded-lg w-fit mx-auto mb-4">
                    <Target className="w-8 h-8 text-purple-400" />
                  </div>
                  <h4 className="font-medium text-gray-100 mb-2">创建策略</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    使用可视化编辑器创建您的交易策略
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="功能开发中"
                    className="opacity-50 cursor-not-allowed"
                  >
                    立即创建
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="text-center">
                  <div className="p-3 bg-blue-600/20 rounded-lg w-fit mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="font-medium text-gray-100 mb-2">回测验证</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    在历史数据中验证策略的有效性
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="功能开发中"
                    className="opacity-50 cursor-not-allowed"
                  >
                    开始回测
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardBody>
                <div className="text-center">
                  <div className="p-3 bg-green-600/20 rounded-lg w-fit mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                  <h4 className="font-medium text-gray-100 mb-2">策略市场</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    发现社区中的优秀策略
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="功能开发中"
                    className="opacity-50 cursor-not-allowed"
                  >
                    浏览策略
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
