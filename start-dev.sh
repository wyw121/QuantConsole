#!/bin/bash

# QuantConsole 开发环境启动脚本

echo "🚀 启动 QuantConsole 开发环境..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请启动 Docker Desktop"
    exit 1
fi

# 启动数据库服务
echo "📦 启动数据库服务..."
docker-compose up -d mysql redis

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 检查数据库连接
until docker exec quantconsole-mysql mysqladmin ping -h"localhost" --silent; do
    echo "⏳ 等待 MySQL 启动..."
    sleep 5
done

echo "✅ 数据库已启动"

# 启动后端
echo "🦀 启动 Rust 后端..."
cd backend
cargo run &
BACKEND_PID=$!

# 等待后端启动
sleep 5

# 启动前端
echo "⚛️  启动 React 前端..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "🎉 QuantConsole 开发环境已启动！"
echo "前端访问地址: http://localhost:3000"
echo "后端访问地址: http://localhost:8080"
echo "数据库管理: http://localhost:8081"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获中断信号并清理进程
trap 'echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit' INT

# 等待进程结束
wait
