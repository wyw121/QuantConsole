import { Button } from '@/components/Button'
import { Card, CardBody, CardHeader } from '@/components/UI'
import { useAuth } from '@/hooks'
import React from 'react'

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* 顶部导航栏 */}
      <header className="bg-dark-900 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold gradient-text">
                QuantConsole
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                欢迎, {user?.username || user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
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
              <p className="text-gray-400 mt-1">
                您的专业加密货币交易控制台
              </p>
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

          {/* 用户信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-100">
                  账户信息
                </h3>
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
                    <span className={user?.isEmailVerified ? 'text-green-400' : 'text-yellow-400'}>
                      {user?.isEmailVerified ? '已验证' : '未验证'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">双因素认证:</span>
                    <span className={user?.isTwoFactorEnabled ? 'text-green-400' : 'text-gray-400'}>
                      {user?.isTwoFactorEnabled ? '已启用' : '未启用'}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-100">
                  快速操作
                </h3>
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
              <h3 className="text-lg font-medium text-gray-100">
                系统状态
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">99.9%</div>
                  <div className="text-sm text-gray-400">系统稳定性</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">&lt; 50ms</div>
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
  )
}
