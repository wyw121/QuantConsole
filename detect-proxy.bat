@echo off
echo 🔍 QuantConsole SSR代理端口检测工具
echo ======================================

echo 正在检测常见的SSR代理端口...

REM 测试常见端口是否开放
echo 🧪 测试端口 1080 (Shadowsocks/V2Ray SOCKS5)...
netstat -an | findstr "127.0.0.1:1080" > nul
if %errorlevel%==0 (
    echo ✅ 端口 1080 正在监听
    set FOUND_1080=1
) else (
    echo ❌ 端口 1080 未开放
)

echo 🧪 测试端口 7890 (Clash HTTP)...
netstat -an | findstr "127.0.0.1:7890" > nul
if %errorlevel%==0 (
    echo ✅ 端口 7890 正在监听
    set FOUND_7890=1
) else (
    echo ❌ 端口 7890 未开放
)

echo 🧪 测试端口 10809 (V2RayN HTTP)...
netstat -an | findstr "127.0.0.1:10809" > nul
if %errorlevel%==0 (
    echo ✅ 端口 10809 正在监听
    set FOUND_10809=1
) else (
    echo ❌ 端口 10809 未开放
)

echo 🧪 测试端口 1087 (Shadowsocks HTTP)...
netstat -an | findstr "127.0.0.1:1087" > nul
if %errorlevel%==0 (
    echo ✅ 端口 1087 正在监听
    set FOUND_1087=1
) else (
    echo ❌ 端口 1087 未开放
)

echo.
echo 💡 建议的代理配置：
echo ================

if defined FOUND_7890 (
    echo 🎯 检测到 Clash 代理 - 建议使用：
    echo    set HTTP_PROXY=http://127.0.0.1:7890
    echo    set HTTPS_PROXY=http://127.0.0.1:7890
    echo.
)

if defined FOUND_10809 (
    echo 🎯 检测到 V2RayN HTTP 代理 - 建议使用：
    echo    set HTTP_PROXY=http://127.0.0.1:10809
    echo    set HTTPS_PROXY=http://127.0.0.1:10809
    echo.
)

if defined FOUND_1087 (
    echo 🎯 检测到 Shadowsocks HTTP 代理 - 建议使用：
    echo    set HTTP_PROXY=http://127.0.0.1:1087
    echo    set HTTPS_PROXY=http://127.0.0.1:1087
    echo.
)

if defined FOUND_1080 (
    echo 🎯 检测到端口 1080 - 可能是 SOCKS5，尝试：
    echo    set HTTP_PROXY=http://127.0.0.1:1080
    echo    set HTTPS_PROXY=http://127.0.0.1:1080
    echo    或者:
    echo    set HTTP_PROXY=socks5://127.0.0.1:1080
    echo    set HTTPS_PROXY=socks5://127.0.0.1:1080
    echo.
)

if not defined FOUND_1080 if not defined FOUND_7890 if not defined FOUND_10809 if not defined FOUND_1087 (
    echo ⚠️ 未检测到常见的代理端口
    echo 请检查你的SSR客户端是否正常运行
    echo 或者手动查看你的SSR客户端配置中的本地代理端口
)

echo ====================================
echo 📝 手动检查方法：
echo 1. 打开你的SSR客户端（如V2RayN、Clash等）
echo 2. 查看 "设置" 或 "配置" 中的本地监听端口
echo 3. 在上面的配置中使用对应的端口

pause
