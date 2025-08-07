import { Button } from "@/components/Button";
import { Card, CardBody, CardHeader } from "@/components/UI";
import { useAuth } from "@/hooks";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Eye,
  FileText,
  Globe,
  Settings,
  Target,
  TrendingUp,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* 顶部导航栏 */}
      <header className="bg-dark-900 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard">
                <h1 className="text-xl font-bold gradient-text hover:opacity-80 transition-opacity">
                  QuantConsole
                </h1>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                欢迎, {user?.username || user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 欢迎卡片 */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold text-gray-100">
                欢迎使用 QuantConsole
              </h2>
              <p className="text-gray-400 mt-1">您的专业加密货币交易控制台</p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-gray-300">
                  恭喜您成功登录！QuantConsole 为您提供以下功能：
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-400">
                  <li>实时市场数据和价格监控</li>
                  <li>交易记录管理和分析</li>
                  <li>多交易所 API 集成</li>
                  <li>安全的账户管理系统</li>
                  <li>自定义交易策略配置</li>
                </ul>
              </div>
            </CardBody>
          </Card>

          {/* 功能模块卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 交易控制台 */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-600/20 rounded-lg mr-3">
                      <BarChart3 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-100">
                        交易控制台
                      </h3>
                      <p className="text-sm text-gray-400">
                        实时行情与交易分析
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" />
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300 mb-4">
                  专业的加密货币交易界面，提供实时价格数据、K线图表、订单簿深度和技术指标分析。
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Activity className="w-4 h-4 mr-1" />
                      实时数据
                    </span>
                    <span className="flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      多交易所
                    </span>
                  </div>
                  <Link to="/trading">
                    <Button variant="primary" size="sm">
                      进入控制台
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* 价格监控 - 新增功能 */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-600/20 rounded-lg mr-3">
                      <Eye className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-100">
                        价格监控
                      </h3>
                      <p className="text-sm text-gray-400">
                        关注代币与价格提醒
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300 mb-4">
                  自定义关注代币列表，设置智能价格提醒，多交易所数据对比分析。
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Activity className="w-4 h-4 mr-1" />
                      智能提醒
                    </span>
                    <span className="flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      数据对比
                    </span>
                  </div>
                  <Link to="/watchlist">
                    <Button variant="primary" size="sm">
                      进入监控
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* 交易策略 - 新增功能 */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-600/20 rounded-lg mr-3">
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-100">
                        交易策略
                      </h3>
                      <p className="text-sm text-gray-400">
                        策略编辑与回测系统
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300 mb-4">
                  可视化策略编辑器，支持多指标组合，历史数据回测验证。
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      可视编辑
                    </span>
                    <span className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      回测验证
                    </span>
                  </div>
                  <Link to="/strategy">
                    <Button variant="primary" size="sm">
                      进入策略
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* 自动交易 - 新增功能 */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-600/20 rounded-lg mr-3">
                      <Bot className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-100">
                        自动交易
                      </h3>
                      <p className="text-sm text-gray-400">
                        智能机器人与跟单交易
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300 mb-4">
                  Copy Trading跟单系统，网格交易机器人，自动化交易策略执行。
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Bot className="w-4 h-4 mr-1" />
                      智能机器人
                    </span>
                    <span className="flex items-center">
                      <Activity className="w-4 h-4 mr-1" />
                      自动执行
                    </span>
                  </div>
                  <Link to="/trading-bot">
                    <Button variant="primary" size="sm">
                      进入机器人
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* 交易记录 */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-600/20 rounded-lg mr-3">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-100">
                        交易记录
                      </h3>
                      <p className="text-sm text-gray-400">
                        管理和分析交易历史
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300 mb-4">
                  详细的交易记录管理，包括盈亏分析、统计报表和交易策略回测功能。
                </p>
                <div className="text-center text-gray-500 py-2">
                  功能开发中...
                </div>
              </CardBody>
            </Card>

            {/* 交易所配置 */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-600/20 rounded-lg mr-3">
                      <Settings className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-100">
                        交易所配置
                      </h3>
                      <p className="text-sm text-gray-400">
                        配置 API 密钥和参数
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-gray-300 mb-4">
                  安全配置欧易、币安等交易所的 API 密钥，支持永续合约交易接口。
                </p>
                <div className="text-center text-gray-500 py-2">
                  功能开发中...
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 用户信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-100">账户信息</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">邮箱:</span>
                    <span className="text-gray-200">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">用户名:</span>
                    <span className="text-gray-200">{user?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">邮箱验证:</span>
                    <span
                      className={
                        user?.isEmailVerified
                          ? "text-green-400"
                          : "text-yellow-400"
                      }
                    >
                      {user?.isEmailVerified ? "已验证" : "未验证"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">双因素认证:</span>
                    <span
                      className={
                        user?.isTwoFactorEnabled
                          ? "text-green-400"
                          : "text-gray-400"
                      }
                    >
                      {user?.isTwoFactorEnabled ? "已启用" : "未启用"}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-100">快速操作</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {!user?.isEmailVerified && (
                    <Button variant="secondary" className="w-full">
                      验证邮箱
                    </Button>
                  )}
                  {!user?.isTwoFactorEnabled && (
                    <Button variant="secondary" className="w-full">
                      启用双因素认证
                    </Button>
                  )}
                  <Button variant="secondary" className="w-full">
                    配置交易所
                  </Button>
                  <Button variant="secondary" className="w-full">
                    查看交易记录
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 系统状态 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-100">系统状态</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">99.9%</div>
                  <div className="text-sm text-gray-400">系统稳定性</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    &lt; 50ms
                  </div>
                  <div className="text-sm text-gray-400">平均响应时间</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">24/7</div>
                  <div className="text-sm text-gray-400">技术支持</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
};
