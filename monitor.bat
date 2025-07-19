@echo off
setlocal EnableDelayedExpansion

echo 📊 QuantConsole 系统监控
echo ================================

echo.
echo 🔍 服务状态检查
echo --------------------------------

REM 检查服务状态函数的替代方案
set services[0]=quantconsole-mysql
set services[1]=quantconsole-redis
set services[2]=quantconsole-backend
set services[3]=quantconsole-frontend
set services[4]=quantconsole-nginx

set service_names[0]=MySQL 数据库
set service_names[1]=Redis 缓存
set service_names[2]=后端服务
set service_names[3]=前端服务
set service_names[4]=Nginx 代理

for /L %%i in (0,1,4) do (
    docker ps --format "table {{.Names}}" | findstr "!services[%%i]!" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ !service_names[%%i]!: 运行中
    ) else (
        echo ❌ !service_names[%%i]!: 已停止
    )
)

echo.
echo 🏥 健康状态检查
echo --------------------------------

REM 检查前端健康状态
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost/health' -UseBasicParsing | Out-Null; Write-Host '✅ 前端服务: 健康' } catch { Write-Host '❌ 前端服务: 不健康' }"

REM 检查后端健康状态
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost/api/health' -UseBasicParsing | Out-Null; Write-Host '✅ 后端API: 健康' } catch { Write-Host '❌ 后端API: 不健康' }"

echo.
echo 📈 资源使用情况
echo --------------------------------

REM 显示容器资源使用情况
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>nul | findstr quantconsole

echo.
echo 💾 磁盘使用情况
echo --------------------------------

REM 显示 Docker 磁盘使用情况
docker system df

echo.
echo 📝 最近日志 (最新10条)
echo --------------------------------

REM 显示最近的日志
docker-compose logs --tail=10 2>nul
if %errorlevel% neq 0 (
    docker-compose -f docker-compose.prod.yml logs --tail=10 2>nul
)

echo.
echo 监控完成

endlocal
