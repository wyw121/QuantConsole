@echo off
setlocal EnableDelayedExpansion

echo 📊 QuantConsole 系统监控
echo ================================

echo.
echo 🔍 服务状态检查
echo --------------------------------

REM 检查进程是否运行
tasklist /fi "imagename eq quantconsole*" /fo csv 2>nul | find /i "quantconsole" >nul
if %errorlevel% equ 0 (
    echo ✅ QuantConsole 后端服务: 运行中
) else (
    echo ❌ QuantConsole 后端服务: 已停止
)

REM 检查 MySQL 服务
sc query MySQL 2>nul | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo ✅ MySQL 数据库: 运行中
) else (
    echo ❌ MySQL 数据库: 已停止
)

echo.
echo 🏥 健康状态检查
echo --------------------------------

REM 检查前端健康状态（假设前端在开发服务器上运行）
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing | Out-Null; Write-Host '✅ 前端服务: 健康' } catch { Write-Host '❌ 前端服务: 不健康' }"

REM 检查后端健康状态
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8080/api/health' -UseBasicParsing | Out-Null; Write-Host '✅ 后端API: 健康' } catch { Write-Host '❌ 后端API: 不健康' }"

echo.
echo 📈 资源使用情况
echo --------------------------------

REM 显示进程资源使用情况
tasklist /fi "imagename eq quantconsole*" /fo table

echo.
echo 💾 磁盘使用情况
echo --------------------------------

REM 显示当前目录磁盘使用情况
dir /-c /s

echo.
echo 📝 系统日志
echo --------------------------------

REM 可以在这里添加日志文件查看逻辑
echo 请查看应用程序日志文件或 Windows 事件查看器

echo.
echo 监控完成

endlocal
