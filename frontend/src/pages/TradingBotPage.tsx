import { Button } from "@/components/Button";
import { Card, CardBody, CardHeader } from "@/components/UI";
import { useAuth } from "@/hooks";
import {
  AlertTriangle,
  Bot,
  Clock,
  Copy,
  DollarSign,
  Filter,
  Grid3X3,
  Plus,
  Search,
  Settings,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

export const TradingBotPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "copy-trading" | "grid-trading"
  >("dashboard");

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
                <span className="text-gray-300 font-medium">
                  自动交易机器人
                </span>
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
                自动交易机器人
              </h2>
              <p className="text-gray-400 mt-1">
                智能交易助手，24/7自动执行交易策略
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
                全局设置
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled
                title="功能开发中"
                className="opacity-50 cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                创建机器人
              </Button>
            </div>
          </div>

          {/* 功能标签页 */}
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "dashboard"
                    ? "border-orange-400 text-orange-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <Bot className="w-4 h-4 inline mr-2" />
                机器人控制台
              </button>
              <button
                onClick={() => setActiveTab("copy-trading")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "copy-trading"
                    ? "border-orange-400 text-orange-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <Copy className="w-4 h-4 inline mr-2" />
                Copy Trading
              </button>
              <button
                onClick={() => setActiveTab("grid-trading")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "grid-trading"
                    ? "border-orange-400 text-orange-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <Grid3X3 className="w-4 h-4 inline mr-2" />
                网格交易
              </button>
            </nav>
          </div>

          {/* 标签页内容 */}
          <div className="mt-6">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* 机器人总览统计 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardBody>
                      <div className="flex items-center">
                        <div className="p-3 bg-green-600/20 rounded-lg mr-4">
                          <Bot className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-100">
                            0
                          </div>
                          <div className="text-sm text-gray-400">
                            活跃机器人
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-600/20 rounded-lg mr-4">
                          <DollarSign className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-100">
                            $0.00
                          </div>
                          <div className="text-sm text-gray-400">总收益</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-600/20 rounded-lg mr-4">
                          <TrendingUp className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-100">
                            0%
                          </div>
                          <div className="text-sm text-gray-400">成功率</div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-600/20 rounded-lg mr-4">
                          <Clock className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-100">
                            0
                          </div>
                          <div className="text-sm text-gray-400">
                            运行时长(天)
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* 机器人列表 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-100">
                        我的机器人
                      </h3>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="搜索机器人..."
                            className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400"
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
                  </CardHeader>
                  <CardBody>
                    <div className="text-center py-12">
                      <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-xl font-medium text-gray-200 mb-3">
                        暂无交易机器人
                      </h4>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        创建您的第一个自动交易机器人，让AI为您24小时执行交易策略
                      </p>
                      <Button
                        variant="primary"
                        disabled
                        title="功能开发中"
                        className="opacity-50 cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        创建机器人
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === "copy-trading" && (
              <div className="space-y-6">
                {/* Copy Trading 介绍 */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-100">
                      Copy Trading 跟单系统
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center py-12">
                      <Copy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-xl font-medium text-gray-200 mb-3">
                        跟单交易系统开发中
                      </h4>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        自动复制优秀交易者的操作，无需手动干预即可获得收益
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                        <div className="bg-dark-700 rounded-lg p-4">
                          <Shield className="w-6 h-6 text-green-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            安全跟单
                          </h5>
                          <p className="text-gray-400 text-xs">智能风控机制</p>
                        </div>
                        <div className="bg-dark-700 rounded-lg p-4">
                          <Zap className="w-6 h-6 text-yellow-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            实时复制
                          </h5>
                          <p className="text-gray-400 text-xs">
                            毫秒级同步执行
                          </p>
                        </div>
                        <div className="bg-dark-700 rounded-lg p-4">
                          <TrendingUp className="w-6 h-6 text-blue-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            收益追踪
                          </h5>
                          <p className="text-gray-400 text-xs">
                            详细的收益报告
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* 待跟单的交易员列表 */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-100">
                      优秀交易员
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center py-8">
                      <p className="text-gray-400">交易员排行榜即将上线...</p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === "grid-trading" && (
              <div className="space-y-6">
                {/* 网格交易介绍 */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-100">
                      网格交易机器人
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center py-12">
                      <Grid3X3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-xl font-medium text-gray-200 mb-3">
                        网格交易系统开发中
                      </h4>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        在价格区间内自动低买高卖，适合震荡行情的稳定收益
                      </p>
                      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-sm">
                        <div className="bg-dark-700 rounded-lg p-4">
                          <Grid3X3 className="w-6 h-6 text-blue-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            智能网格
                          </h5>
                          <p className="text-gray-400 text-xs">
                            自动调节网格间距
                          </p>
                        </div>
                        <div className="bg-dark-700 rounded-lg p-4">
                          <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                          <h5 className="font-medium text-gray-200">
                            稳定收益
                          </h5>
                          <p className="text-gray-400 text-xs">
                            震荡行情获利神器
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>

          {/* 机器人类型快速创建 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="hover:shadow-lg transition-shadow border border-orange-500/20 hover:border-orange-500/40">
              <CardBody>
                <div className="text-center">
                  <div className="p-4 bg-orange-600/20 rounded-lg w-fit mx-auto mb-4">
                    <Copy className="w-8 h-8 text-orange-400" />
                  </div>
                  <h4 className="font-medium text-gray-100 mb-2">
                    Copy Trading
                  </h4>
                  <p className="text-sm text-gray-400 mb-4">
                    跟随优秀交易者，自动复制交易操作
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <p>✨ 智能风控保护</p>
                    <p>⚡ 毫秒级执行</p>
                    <p>📊 收益实时跟踪</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="功能开发中"
                    className="opacity-50 cursor-not-allowed w-full"
                  >
                    立即创建
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border border-blue-500/20 hover:border-blue-500/40">
              <CardBody>
                <div className="text-center">
                  <div className="p-4 bg-blue-600/20 rounded-lg w-fit mx-auto mb-4">
                    <Grid3X3 className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="font-medium text-gray-100 mb-2">网格交易</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    震荡行情中自动低买高卖获利
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <p>🎯 智能网格布局</p>
                    <p>💰 稳定收益来源</p>
                    <p>🔄 24/7自动运行</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="功能开发中"
                    className="opacity-50 cursor-not-allowed w-full"
                  >
                    立即创建
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border border-purple-500/20 hover:border-purple-500/40">
              <CardBody>
                <div className="text-center">
                  <div className="p-4 bg-purple-600/20 rounded-lg w-fit mx-auto mb-4">
                    <Bot className="w-8 h-8 text-purple-400" />
                  </div>
                  <h4 className="font-medium text-gray-100 mb-2">策略机器人</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    基于自定义策略的智能交易
                  </p>
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <p>🎮 可视化策略编辑</p>
                    <p>📈 技术指标支持</p>
                    <p>🔧 参数灵活调节</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="功能开发中"
                    className="opacity-50 cursor-not-allowed w-full"
                  >
                    立即创建
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 风险提示 */}
          <Card className="border border-yellow-500/30 bg-yellow-500/5">
            <CardBody>
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-200 mb-2">风险提示</h4>
                  <p className="text-sm text-yellow-100/80 mb-2">
                    自动交易机器人具有一定风险，使用前请充分了解相关风险并谨慎投资：
                  </p>
                  <ul className="text-xs text-yellow-100/70 space-y-1">
                    <li>• 市场波动可能导致损失，请合理配置资金</li>
                    <li>• 机器人策略可能存在失效风险，需要定期监控和调整</li>
                    <li>• 建议先在小额资金上测试机器人性能</li>
                    <li>• 不要投入您无法承受损失的资金</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
};
