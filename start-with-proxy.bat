@echo off
echo 🚀 QuantConsole SSR代理启动脚本
echo =================================

REM 请根据你的SSR客户端配置修改以下代理地址
REM 常见SSR客户端本地代理端口：
REM - Shadowsocks: 1080 (SOCKS5) 或 1087 (HTTP)
REM - V2Ray/V2RayN: 1080 (SOCKS5) 或 10809 (HTTP)
REM - Clash for Windows: 7890 (HTTP) 或 7891 (SOCKS5)
REM - ShadowsocksR: 1080 (SOCKS5)

REM 请修改下面的代理配置为你的实际配置
REM 如果你的SSR客户端运行在1080端口，使用以下配置：
set HTTP_PROXY=http://127.0.0.1:1080
set HTTPS_PROXY=http://127.0.0.1:1080

REM 如果你的SSR客户端运行在其他端口，请取消注释并修改相应行：
REM set HTTP_PROXY=http://127.0.0.1:7890
REM set HTTPS_PROXY=http://127.0.0.1:7890

REM 如果你的SSR是SOCKS5代理，可以尝试：
REM set HTTP_PROXY=socks5://127.0.0.1:1080
REM set HTTPS_PROXY=socks5://127.0.0.1:1080

echo ✅ 代理环境变量已设置:
echo    HTTP_PROXY = %HTTP_PROXY%
echo    HTTPS_PROXY = %HTTPS_PROXY%
echo    ALL_PROXY = %ALL_PROXY%

echo.
echo 🎯 启动后端服务...
echo 提示: 按 Ctrl+C 可停止服务

cd backend
cargo run

echo.
echo 🔄 服务已停止
