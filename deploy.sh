#!/bin/bash

# QuantConsole 生产环境部署脚本

set -e

echo "🚀 开始部署 QuantConsole 到生产环境..."

# 检查环境变量文件
if [ ! -f ".env.prod" ]; then
    echo "❌ 未找到 .env.prod 文件，请从 .env.prod.example 复制并配置"
    exit 1
fi

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请启动 Docker"
    exit 1
fi

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose -f docker-compose.prod.yml down || true

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker system prune -f

# 构建镜像
echo "🔨 构建应用镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 启动服务
echo "📦 启动服务..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🔍 进行健康检查..."

# 检查数据库
if docker exec quantconsole-mysql-prod mysqladmin ping -h"localhost" --silent; then
    echo "✅ MySQL 服务正常"
else
    echo "❌ MySQL 服务异常"
    exit 1
fi

# 检查 Redis
if docker exec quantconsole-redis-prod redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis 服务正常"
else
    echo "❌ Redis 服务异常"
    exit 1
fi

# 检查后端
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务异常"
    exit 1
fi

# 检查前端
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
    exit 1
fi

echo "🎉 QuantConsole 部署成功！"
echo "访问地址: https://yourdomain.com"
echo "管理界面: docker-compose -f docker-compose.prod.yml logs -f"

# 显示运行状态
docker-compose -f docker-compose.prod.yml ps
