# 安装 Visual Studio Build Tools 2022
# 这个脚本会下载并安装 Visual Studio Build Tools 及 C++ 开发工具

Write-Host "正在下载 Visual Studio Build Tools 2022..." -ForegroundColor Green

# 下载 Visual Studio Build Tools
$url = "https://aka.ms/vs/17/release/vs_buildtools.exe"
$output = "$env:TEMP\vs_buildtools.exe"

try {
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host "下载完成。" -ForegroundColor Green

    Write-Host "正在启动安装程序..." -ForegroundColor Yellow
    Write-Host "请在安装程序中选择 'C++ build tools' 工作负载" -ForegroundColor Yellow
    Write-Host "这包括 MSVC 编译器和 Windows SDK" -ForegroundColor Yellow

    # 启动安装程序
    Start-Process -FilePath $output -Wait

    Write-Host "安装完成！请重启 VS Code 并重新尝试构建项目。" -ForegroundColor Green

} catch {
    Write-Host "下载失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请手动访问 https://visualstudio.microsoft.com/visual-cpp-build-tools/ 下载" -ForegroundColor Yellow
}

# 清理临时文件
if (Test-Path $output) {
    Remove-Item $output -Force
}
