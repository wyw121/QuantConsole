#!/bin/bash

# QuantConsole 快速启动脚本 (Linux/Mac)

echo "🚀 启动 QuantConsole 交易控制台..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 QuantConsole 根目录运行此脚本"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未安装 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未安装 npm，请先安装 npm"
    exit 1
fi

echo "📦 安装前端依赖..."
cd frontend
npm install

echo "🔥 启动前端开发服务器..."
npm run dev &
FRONTEND_PID=$!

echo "✅ 前端服务已启动"
echo "🌐 访问地址: http://localhost:3001"
echo "📊 交易控制台: http://localhost:3001/trading"
echo ""
echo "💡 使用说明:"
echo "   1. 在浏览器中访问 http://localhost:3001"
echo "   2. 注册或登录账户"
echo "   3. 点击交易控制台进入主界面"
echo "   4. 点击右上角的'设置'按钮配置数据源"
echo "   5. 选择'真实数据'体验真实市场数据"
echo ""
echo "⌨️  按 Ctrl+C 停止服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $FRONTEND_PID 2>/dev/null; echo '✅ 服务已停止'; exit 0" INT

# 保持脚本运行
wait $FRONTEND_PID
