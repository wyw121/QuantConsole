#!/bin/bash

# QuantConsole 监控脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 QuantConsole 系统监控${NC}"
echo "================================"

# 检查服务状态
check_service() {
    local service_name=$1
    local container_name=$2

    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        echo -e "${GREEN}✅ $service_name: 运行中${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name: 已停止${NC}"
        return 1
    fi
}

# 检查服务健康状态
check_health() {
    local service_name=$1
    local url=$2

    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name: 健康${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name: 不健康${NC}"
        return 1
    fi
}

# 获取容器资源使用情况
get_container_stats() {
    local container_name=$1

    if docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep -q "$container_name"; then
        docker stats --no-stream --format "{{.Name}}: CPU {{.CPUPerc}}, 内存 {{.MemUsage}}" | grep "$container_name"
    else
        echo "$container_name: 未运行"
    fi
}

echo -e "\n${YELLOW}🔍 服务状态检查${NC}"
echo "--------------------------------"

# 检查所有服务
check_service "MySQL 数据库" "quantconsole-mysql"
check_service "Redis 缓存" "quantconsole-redis"
check_service "后端服务" "quantconsole-backend"
check_service "前端服务" "quantconsole-frontend"
check_service "Nginx 代理" "quantconsole-nginx"

echo -e "\n${YELLOW}🏥 健康状态检查${NC}"
echo "--------------------------------"

# 健康检查
check_health "前端服务" "http://localhost/health"
check_health "后端API" "http://localhost/api/health"

echo -e "\n${YELLOW}📈 资源使用情况${NC}"
echo "--------------------------------"

# 资源使用情况
get_container_stats "quantconsole-mysql"
get_container_stats "quantconsole-redis"
get_container_stats "quantconsole-backend"
get_container_stats "quantconsole-frontend"
get_container_stats "quantconsole-nginx"

echo -e "\n${YELLOW}💾 磁盘使用情况${NC}"
echo "--------------------------------"

# 检查 Docker 卷使用情况
docker system df

echo -e "\n${YELLOW}📝 最近日志 (最新10条)${NC}"
echo "--------------------------------"

# 显示最近的错误日志
docker-compose logs --tail=10 2>/dev/null || docker-compose -f docker-compose.prod.yml logs --tail=10

echo -e "\n${BLUE}监控完成${NC}"
