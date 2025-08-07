import { NotificationContainer } from "@/components/NotificationContainer";
import "@/index.css";
import { DashboardPage } from "@/pages/DashboardPage";
import ExchangeDataComparison from "@/pages/ExchangeDataComparison";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { SecuritySettingsPage } from "@/pages/SecuritySettingsPage";
import { StrategyPage } from "@/pages/StrategyPage";
import { TestCoinGecko } from "@/pages/TestCoinGecko";
import { TradingBotPage } from "@/pages/TradingBotPage";
import { TradingDashboardPage } from "@/pages/TradingDashboardPage";
import { WatchlistPage } from "@/pages/WatchlistPage";
import { useAuthStore } from "@/store/auth";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

// 创建 Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 分钟
      refetchOnWindowFocus: false,
    },
  },
});

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

// 认证路由组件（已登录用户不能访问）
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-dark-950">
          <Routes>
            {/* 根路径重定向 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 认证路由 */}
            <Route
              path="/auth/login"
              element={
                <AuthRoute>
                  <LoginPage />
                </AuthRoute>
              }
            />
            <Route
              path="/auth/register"
              element={
                <AuthRoute>
                  <RegisterPage />
                </AuthRoute>
              }
            />

            {/* 受保护的路由 */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trading"
              element={
                <ProtectedRoute>
                  <TradingDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/watchlist"
              element={
                <ProtectedRoute>
                  <WatchlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/strategy"
              element={
                <ProtectedRoute>
                  <StrategyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trading-bot"
              element={
                <ProtectedRoute>
                  <TradingBotPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/security"
              element={
                <ProtectedRoute>
                  <SecuritySettingsPage />
                </ProtectedRoute>
              }
            />

            {/* 测试页面 */}
            <Route path="/test/coingecko" element={<TestCoinGecko />} />

            <Route
              path="/test/comparison"
              element={<ExchangeDataComparison />}
            />

            {/* 数据对比页面 - 也可通过价格监控访问 */}
            <Route
              path="/watchlist/comparison"
              element={
                <ProtectedRoute>
                  <ExchangeDataComparison />
                </ProtectedRoute>
              }
            />

            {/* 404 页面 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          {/* 全局通知容器 */}
          <NotificationContainer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

// 404 页面组件
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-600">404</h1>
        <p className="text-xl text-gray-400 mt-4">页面未找到</p>
        <div className="mt-6">
          <a href="/dashboard" className="btn-primary inline-block">
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
