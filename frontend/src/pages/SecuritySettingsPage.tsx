import { Button } from "@/components/Button";
import { Card, CardBody, CardHeader } from "@/components/UI";
import { useSecurityAuth } from "@/hooks/useSecurityAuth";
import React, { useState } from "react";

export const SecuritySettingsPage: React.FC = () => {
  const {
    securitySettings,
    activeDevices,
    recentLoginAttempts,
    revokeDeviceAccess,
    toggleDeviceTrust,
    updateSecuritySettings,
    logoutAllDevices,
  } = useSecurityAuth();

  const [isLoading, setIsLoading] = useState(false);

  const handleSettingChange = async (
    key: keyof typeof securitySettings,
    value: any
  ) => {
    setIsLoading(true);
    await updateSecuritySettings({ [key]: value });
    setIsLoading(false);
  };

  const handleLogoutAllDevices = async () => {
    if (confirm("确定要从所有设备登出吗？这将终止所有活跃会话。")) {
      await logoutAllDevices();
    }
  };

  const getDeviceIcon = (browser: string) => {
    if (browser.includes("Chrome")) return "🌐";
    if (browser.includes("Firefox")) return "🦊";
    if (browser.includes("Safari")) return "🧭";
    if (browser.includes("Edge")) return "📘";
    return "💻";
  };

  const getLocationFlag = (location?: string) => {
    if (!location) return "🌍";
    if (location.includes("中国")) return "🇨🇳";
    if (location.includes("美国")) return "🇺🇸";
    if (location.includes("日本")) return "🇯🇵";
    return "🌍";
  };

  return (
    <div className="min-h-screen bg-dark-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100">安全设置</h1>
          <p className="text-gray-400 mt-2">管理您的账户安全和设备访问权限</p>
        </div>

        {/* 安全设置 */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-100">
              安全偏好设置
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-200">
                  设备跟踪
                </label>
                <p className="text-xs text-gray-400">监控和管理登录设备</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={securitySettings.enableDeviceTracking}
                  onChange={(e) =>
                    handleSettingChange(
                      "enableDeviceTracking",
                      e.target.checked
                    )
                  }
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-200">
                  位置跟踪
                </label>
                <p className="text-xs text-gray-400">记录登录地理位置信息</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={securitySettings.enableLocationTracking}
                  onChange={(e) =>
                    handleSettingChange(
                      "enableLocationTracking",
                      e.target.checked
                    )
                  }
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-200">
                  登录通知
                </label>
                <p className="text-xs text-gray-400">新设备登录时发送通知</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={securitySettings.enableLoginNotifications}
                  onChange={(e) =>
                    handleSettingChange(
                      "enableLoginNotifications",
                      e.target.checked
                    )
                  }
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-200">
                  敏感操作双重验证
                </label>
                <p className="text-xs text-gray-400">
                  交易等敏感操作需要双因素认证
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={securitySettings.requireTwoFactorForSensitive}
                  onChange={(e) =>
                    handleSettingChange(
                      "requireTwoFactorForSensitive",
                      e.target.checked
                    )
                  }
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">
                会话超时时间
              </label>
              <select
                value={securitySettings.sessionTimeout}
                onChange={(e) =>
                  handleSettingChange(
                    "sessionTimeout",
                    parseInt(e.target.value)
                  )
                }
                disabled={isLoading}
                className="w-full px-3 py-2 bg-dark-800 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={15}>15 分钟</option>
                <option value={30}>30 分钟</option>
                <option value={60}>1 小时</option>
                <option value={120}>2 小时</option>
                <option value={480}>8 小时</option>
              </select>
            </div>
          </CardBody>
        </Card>

        {/* 活跃设备 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">活跃设备</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogoutAllDevices}
                className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
              >
                登出所有设备
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {activeDevices.map((device) => (
                <div
                  key={device.deviceId}
                  className="flex items-center justify-between p-4 bg-dark-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getDeviceIcon(device.browser)}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-100">
                          {device.deviceName}
                        </h3>
                        {device.isCurrentDevice && (
                          <span className="px-2 py-1 text-xs bg-green-600 text-green-100 rounded">
                            当前设备
                          </span>
                        )}
                        {device.isTrusted && (
                          <span className="px-2 py-1 text-xs bg-blue-600 text-blue-100 rounded">
                            已信任
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {device.browser} • {device.os}
                      </p>
                      <p className="text-xs text-gray-500">
                        最后活跃: {device.lastSeen}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!device.isCurrentDevice && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleDeviceTrust(
                              device.deviceId,
                              !device.isTrusted
                            )
                          }
                          className="text-gray-400 hover:text-gray-200"
                        >
                          {device.isTrusted ? "取消信任" : "信任"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeDeviceAccess(device.deviceId)}
                          className="text-red-400 hover:text-red-300"
                        >
                          移除
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {activeDevices.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>暂无活跃设备记录</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* 最近登录尝试 */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-100">
              最近登录尝试
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {recentLoginAttempts.slice(0, 10).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 bg-dark-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {getLocationFlag(attempt.location)}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            attempt.success ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm text-gray-100">
                          {attempt.success ? "登录成功" : "登录失败"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {attempt.ipAddress} • {attempt.location || "未知位置"}
                      </p>
                      {!attempt.success && attempt.reason && (
                        <p className="text-xs text-red-400">{attempt.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(attempt.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}

              {recentLoginAttempts.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>暂无登录记录</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
