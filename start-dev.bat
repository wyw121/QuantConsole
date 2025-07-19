@echo off
setlocal

echo 🚀 启动 QuantConsole 开发环境...

REM 检查 Docker 是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未运行，请启动 Docker Desktop
    exit /b 1
)

REM 启动数据库服务
echo 📦 启动数据库服务...
docker-compose up -d mysql redis

REM 等待数据库启动
echo ⏳ 等待数据库启动...
timeout /t 10 /nobreak >nul

:wait_mysql
docker exec quantconsole-mysql mysqladmin ping -h"localhost" --silent >nul 2>&1
if %errorlevel% neq 0 (
    echo ⏳ 等待 MySQL 启动...
    timeout /t 5 /nobreak >nul
    goto wait_mysql
)

echo ✅ 数据库已启动

REM 启动后端
echo 🦀 启动 Rust 后端...
cd backend
start "QuantConsole Backend" cargo run

REM 等待后端启动
timeout /t 5 /nobreak >nul

REM 启动前端
echo ⚛️  启动 React 前端...
cd ..\frontend
start "QuantConsole Frontend" npm run dev

echo.
echo 🎉 QuantConsole 开发环境已启动！
echo 前端访问地址: http://localhost:3000
echo 后端访问地址: http://localhost:8080
echo 数据库管理: http://localhost:8081
echo.
echo 按任意键停止所有服务...
pause >nul

REM 停止服务
echo 🛑 正在停止服务...
docker-compose down

endlocal
