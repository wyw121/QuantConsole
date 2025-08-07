import { useAuth } from "@/hooks";
import { jwtService } from "@/services/jwt";
import { useNotificationStore } from "@/store/ui";
import { useCallback, useEffect, useState } from "react";

interface SecuritySettings {
  enableDeviceTracking: boolean;
  enableLocationTracking: boolean;
  enableLoginNotifications: boolean;
  sessionTimeout: number; // 分钟
  maxConcurrentSessions: number;
  requireTwoFactorForSensitive: boolean;
}

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  lastSeen: string;
  isCurrentDevice: boolean;
  isTrusted: boolean;
}

interface LoginAttempt {
  id: string;
  ipAddress: string;
  location?: string;
  userAgent: string;
  success: boolean;
  timestamp: string;
  reason?: string;
}

export const useSecurityAuth = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { addNotification } = useNotificationStore();

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enableDeviceTracking: true,
    enableLocationTracking: false,
    enableLoginNotifications: true,
    sessionTimeout: 30,
    maxConcurrentSessions: 3,
    requireTwoFactorForSensitive: false,
  });

  const [activeDevices, setActiveDevices] = useState<DeviceInfo[]>([]);
  const [recentLoginAttempts, setRecentLoginAttempts] = useState<
    LoginAttempt[]
  >([]);
  const [isSessionExpiringSoon, setIsSessionExpiringSoon] = useState(false);

  // 设备指纹识别
  const generateDeviceFingerprint = useCallback((): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx?.fillText("QuantConsole", 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency,
      (navigator as any).deviceMemory,
    ].join("|");

    return btoa(fingerprint).substring(0, 32);
  }, []);

  // 检查会话安全状态
  const checkSessionSecurity = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // 检查令牌是否即将过期
    const isExpiring = jwtService.isTokenExpiringSoon(token);
    setIsSessionExpiringSoon(isExpiring);

    if (isExpiring) {
      addNotification({
        type: "warning",
        title: "会话即将过期",
        message: "您的登录会话将在5分钟内过期，请保存您的工作",
        // duration: 10000,
      });
    }

    // 验证设备指纹
    const currentFingerprint = generateDeviceFingerprint();
    const storedFingerprint = localStorage.getItem("deviceFingerprint");

    if (storedFingerprint && storedFingerprint !== currentFingerprint) {
      addNotification({
        type: "error",
        title: "设备异常",
        message: "检测到设备环境发生变化，请重新登录",
        // duration: 0, // 不自动消失
      });
      logout();
      return;
    }

    if (!storedFingerprint) {
      localStorage.setItem("deviceFingerprint", currentFingerprint);
    }
  }, [generateDeviceFingerprint, addNotification, logout]);

  // 自动刷新令牌
  const autoRefreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return;

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.accessToken);

        addNotification({
          type: "info",
          title: "会话已续期",
          message: "您的登录会话已自动续期",
        });
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }
  }, [addNotification]);

  // 获取活跃设备列表
  const fetchActiveDevices = useCallback(async () => {
    try {
      const response = await fetch("/api/user/devices", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const devices = await response.json();
        setActiveDevices(devices.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
  }, []);

  // 获取最近登录尝试
  const fetchRecentLoginAttempts = useCallback(async () => {
    try {
      const response = await fetch("/api/user/login-attempts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const attempts = await response.json();
        setRecentLoginAttempts(attempts.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch login attempts:", error);
    }
  }, []);

  // 撤销设备访问权限
  const revokeDeviceAccess = useCallback(
    async (deviceId: string) => {
      try {
        const response = await fetch(`/api/user/devices/${deviceId}/revoke`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (response.ok) {
          addNotification({
            type: "success",
            title: "设备已移除",
            message: "设备访问权限已成功撤销",
          });
          fetchActiveDevices();
        }
      } catch (error) {
        console.error("Failed to revoke device access:", error);
        addNotification({
          type: "error",
          title: "操作失败",
          message: "无法撤销设备访问权限",
        });
      }
    },
    [addNotification, fetchActiveDevices]
  );

  // 启用/禁用设备信任状态
  const toggleDeviceTrust = useCallback(
    async (deviceId: string, trusted: boolean) => {
      try {
        const response = await fetch(`/api/user/devices/${deviceId}/trust`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ trusted }),
        });

        if (response.ok) {
          addNotification({
            type: "success",
            title: trusted ? "设备已信任" : "设备信任已移除",
            message: trusted
              ? "该设备已添加到信任列表"
              : "该设备已从信任列表移除",
          });
          fetchActiveDevices();
        }
      } catch (error) {
        console.error("Failed to toggle device trust:", error);
      }
    },
    [addNotification, fetchActiveDevices]
  );

  // 更新安全设置
  const updateSecuritySettings = useCallback(
    async (settings: Partial<SecuritySettings>) => {
      try {
        const response = await fetch("/api/user/security-settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(settings),
        });

        if (response.ok) {
          setSecuritySettings((prev) => ({ ...prev, ...settings }));
          addNotification({
            type: "success",
            title: "设置已保存",
            message: "安全设置已成功更新",
          });
        }
      } catch (error) {
        console.error("Failed to update security settings:", error);
        addNotification({
          type: "error",
          title: "保存失败",
          message: "无法更新安全设置",
        });
      }
    },
    [addNotification]
  );

  // 强制登出所有设备
  const logoutAllDevices = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        logout();
        addNotification({
          type: "info",
          title: "已登出所有设备",
          message: "您已从所有设备安全登出",
        });
      }
    } catch (error) {
      console.error("Failed to logout all devices:", error);
    }
  }, [logout, addNotification]);

  // 初始化安全检查
  useEffect(() => {
    if (isAuthenticated && user) {
      checkSessionSecurity();
      fetchActiveDevices();
      fetchRecentLoginAttempts();

      // 设置定期安全检查
      const securityInterval = setInterval(checkSessionSecurity, 60000); // 每分钟检查
      const refreshInterval = setInterval(() => {
        if (isSessionExpiringSoon) {
          autoRefreshToken();
        }
      }, 30000); // 每30秒检查是否需要刷新令牌

      return () => {
        clearInterval(securityInterval);
        clearInterval(refreshInterval);
      };
    }
  }, [
    isAuthenticated,
    user,
    checkSessionSecurity,
    fetchActiveDevices,
    fetchRecentLoginAttempts,
    isSessionExpiringSoon,
    autoRefreshToken,
  ]);

  return {
    // 安全状态
    securitySettings,
    activeDevices,
    recentLoginAttempts,
    isSessionExpiringSoon,

    // 安全操作
    revokeDeviceAccess,
    toggleDeviceTrust,
    updateSecuritySettings,
    logoutAllDevices,
    checkSessionSecurity,
    autoRefreshToken,

    // 工具函数
    generateDeviceFingerprint,
  };
};
