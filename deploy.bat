@echo off
setlocal

echo 🚀 开始部署 QuantConsole 到生产环境...

REM 检查环境变量文件
if not exist ".env.prod" (
    echo ❌ 未找到 .env.prod 文件，请从 .env.prod.example 复制并配置
    exit /b 1
)

REM 检查 Docker 是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未运行，请启动 Docker
    exit /b 1
)

REM 停止现有服务
echo 🛑 停止现有服务...
docker-compose -f docker-compose.prod.yml down 2>nul

REM 清理旧镜像
echo 🧹 清理旧镜像...
docker system prune -f

REM 构建镜像
echo 🔨 构建应用镜像...
docker-compose -f docker-compose.prod.yml build --no-cache

REM 启动服务
echo 📦 启动服务...
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 30 /nobreak >nul

REM 健康检查
echo 🔍 进行健康检查...

REM 检查数据库
docker exec quantconsole-mysql-prod mysqladmin ping -h"localhost" --silent >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MySQL 服务正常
) else (
    echo ❌ MySQL 服务异常
    exit /b 1
)

REM 检查 Redis
docker exec quantconsole-redis-prod redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis 服务正常
) else (
    echo ❌ Redis 服务异常
    exit /b 1
)

REM 检查后端 (使用 PowerShell 的 Invoke-WebRequest)
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost/api/health' -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo ✅ 后端服务正常
) else (
    echo ❌ 后端服务异常
    exit /b 1
)

REM 检查前端
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost/health' -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo ✅ 前端服务正常
) else (
    echo ❌ 前端服务异常
    exit /b 1
)

echo.
echo 🎉 QuantConsole 部署成功！
echo 访问地址: https://yourdomain.com
echo 管理界面: docker-compose -f docker-compose.prod.yml logs -f
echo.

REM 显示运行状态
docker-compose -f docker-compose.prod.yml ps

endlocal
