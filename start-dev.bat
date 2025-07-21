@echo off
setlocal

echo 🚀 启动 QuantConsole 开发环境...

REM 检查 MySQL 服务是否运行
sc query MySQL 2>nul | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo ❌ MySQL 服务未运行，请启动 MySQL 服务
    echo 提示: 运行 'net start MySQL' 或通过服务管理器启动
    exit /b 1
)

echo ✅ 数据库服务已运行

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
echo.
echo 按任意键关闭启动窗口...
pause >nul

endlocal
