import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/Button";
import { StrategyEditor } from '@/components/Strategy/StrategyEditor';
import { BacktestPanel } from '@/components/Strategy/BacktestPanel';
import { StrategyList } from '@/components/Strategy/StrategyList';
import { useAuth } from "@/hooks";
import { useStrategyStore } from '@/store/strategy';
import { TradingStrategy } from '@/types/strategy';

export const StrategyPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    selectedStrategy, 
    selectStrategy,
    initializeEditor,
    resetEditor
  } = useStrategyStore();
  
  const [activeTab, setActiveTab] = useState<"list" | "editor" | "backtest">("list");
  const [editingStrategy, setEditingStrategy] = useState<TradingStrategy | null>(null);

  // 处理创建新策略
  const handleCreateNew = () => {
    setEditingStrategy(null);
    selectStrategy(null);
    initializeEditor();
    setActiveTab("editor");
  };

  // 处理编辑策略
  const handleEditStrategy = (strategy: TradingStrategy) => {
    setEditingStrategy(strategy);
    selectStrategy(strategy);
    initializeEditor(strategy);
    setActiveTab("editor");
  };

  // 处理回到列表
  const handleBackToList = () => {
    setEditingStrategy(null);
    selectStrategy(null);
    resetEditor();
    setActiveTab("list");
  };

  // 处理登出
  const handleLogout = async () => {
    await logout();
  };

  // 切换标签页时的逻辑
  const handleTabChange = (tab: "list" | "editor" | "backtest") => {
    if (tab === "backtest" && !selectedStrategy) {
      alert("请先选择一个策略进行回测");
      return;
    }
    setActiveTab(tab);
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
          {/* 页面标题和导航 */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-100">
                交易策略中心
              </h2>
              <p className="text-gray-400 mt-1">
                创建、测试和优化您的交易策略
              </p>
            </div>
            
            {activeTab !== "list" && (
              <Button
                variant="ghost"
                onClick={handleBackToList}
                className="text-gray-400 hover:text-gray-200"
              >
                ← 返回列表
              </Button>
            )}
          </div>

          {/* 功能标签页 */}
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange("list")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "list"
                    ? "border-purple-400 text-purple-400"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                策略列表
              </button>
              
              <button
                onClick={() => handleTabChange("editor")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "editor"
                    ? "border-purple-400 text-purple-400"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                {editingStrategy ? "编辑策略" : "创建策略"}
              </button>
              
              <button
                onClick={() => handleTabChange("backtest")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "backtest"
                    ? "border-purple-400 text-purple-400"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                策略回测
              </button>
            </nav>
          </div>

          {/* 内容区域 */}
          <div className="min-h-[600px]">
            {activeTab === "list" && (
              <StrategyList
                onCreateNew={handleCreateNew}
                onEditStrategy={handleEditStrategy}
              />
            )}

            {activeTab === "editor" && (
              <div className="space-y-6">
                {editingStrategy && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-400 font-medium">
                        正在编辑策略: {editingStrategy.name}
                      </span>
                    </div>
                  </div>
                )}
                <StrategyEditor />
              </div>
            )}

            {activeTab === "backtest" && (
              <BacktestPanel strategy={selectedStrategy || undefined} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
