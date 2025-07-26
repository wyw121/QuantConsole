import React, { useState } from "react";

console.log("🔍 [DEBUG] ExchangeDataComparison_debug.tsx 文件正在加载...");

/**
 * 简化的数据监控组件 - 用于调试导出问题
 */
const ExchangeDataComparison: React.FC = () => {
  console.log("🔍 [DEBUG] ExchangeDataComparison 组件正在渲染...");

  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = () => {
    console.log("🔍 [DEBUG] 开始监控...");
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    console.log("🔍 [DEBUG] 停止监控...");
    setIsMonitoring(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">数据监控工具 - 调试版本</h1>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">监控状态</h2>
          <p className="mb-4">当前状态: {isMonitoring ? "监控中" : "已停止"}</p>

          <div className="flex gap-4">
            <button
              onClick={startMonitoring}
              disabled={isMonitoring}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              开始监控
            </button>

            <button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              停止监控
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-700 rounded">
            <h3 className="text-lg font-bold mb-2">调试信息</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>✅ 组件已成功加载</li>
              <li>✅ React hooks 工作正常</li>
              <li>✅ 状态管理正常</li>
              <li>✅ 导出应该正常工作</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

console.log("🔍 [DEBUG] ExchangeDataComparison 组件定义完成，准备导出...");

export default ExchangeDataComparison;

console.log(
  "🔍 [DEBUG] ExchangeDataComparison_debug.tsx 文件加载完成，默认导出已设置"
);
