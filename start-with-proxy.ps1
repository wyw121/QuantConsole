# QuantConsole 带代理启动脚本
# 使用方法: .\start-with-proxy.ps1 -ProxyHost "127.0.0.1" -ProxyPort "1080" -ProxyType "http"

param(
    [string]$ProxyHost = "127.0.0.1",
    [string]$ProxyPort = "1080",
    [string]$ProxyType = "http"  # 可选: "http", "socks5"
)

Write-Host "🚀 QuantConsole SSR代理启动脚本" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# 构建代理URL
$ProxyUrl = "${ProxyType}://${ProxyHost}:${ProxyPort}"
Write-Host "🔧 配置代理: $ProxyUrl" -ForegroundColor Yellow

# 设置环境变量
$env:HTTP_PROXY = $ProxyUrl
$env:HTTPS_PROXY = $ProxyUrl
$env:ALL_PROXY = $ProxyUrl

Write-Host "✅ 代理环境变量已设置:" -ForegroundColor Green
Write-Host "   HTTP_PROXY = $env:HTTP_PROXY" -ForegroundColor Cyan
Write-Host "   HTTPS_PROXY = $env:HTTPS_PROXY" -ForegroundColor Cyan
Write-Host "   ALL_PROXY = $env:ALL_PROXY" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎯 启动后端服务..." -ForegroundColor Yellow
Write-Host "提示: 按 Ctrl+C 可停止服务" -ForegroundColor Gray

# 启动后端服务
Set-Location "backend"
cargo run

Write-Host ""
Write-Host "🔄 服务已停止，代理配置已清除" -ForegroundColor Yellow
