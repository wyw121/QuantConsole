@echo off
REM QuantConsole 快速启动脚本 (Windows) - 不使用 Docker

echo 🚀 启动 QuantConsole 交易控制台 (前端模式)...

REM 检查是否在正确的目录
if not exist "package.json" (
    echo ❌ 错误：请在 QuantConsole 根目录运行此脚本
    pause
    exit /b 1
)

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误：未安装 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查 npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误：未安装 npm，请先安装 npm
    pause
    exit /b 1
)

echo 📦 安装前端依赖...
cd frontend
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 🔥 启动前端开发服务器...
echo.
echo ✅ 前端服务正在启动...
echo 🌐 访问地址: http://localhost:3001
echo 📊 交易控制台: http://localhost:3001/trading
echo 🧪 API测试页面: http://localhost:3001/test-binance-api.html
echo.
echo 💡 使用说明:
echo    1. 在浏览器中访问 http://localhost:3001
echo    2. 注册或登录账户 (或直接访问交易控制台)
echo    3. 点击交易控制台进入主界面
echo    4. 点击右上角的'设置'按钮配置数据源
echo    5. 选择'真实数据'体验真实市场数据
echo    6. 如有问题，访问测试页面检查网络连接
echo.
echo ⌨️  按 Ctrl+C 停止服务
echo.

REM 启动开发服务器
call npm run dev
