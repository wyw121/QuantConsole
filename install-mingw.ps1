# 下载并安装 MinGW-w64 的脚本
# 不需要管理员权限

$mingwUrl = 'https://github.com/niXman/mingw-builds-binaries/releases/download/14.2.0-rt_v12-rev0/x86_64-14.2.0-release-posix-seh-ucrt-rt_v12-rev0.7z'
$downloadPath = "$env:TEMP\mingw.7z"
$installPath = "$env:USERPROFILE\mingw64"

Write-Host '正在下载 MinGW-w64...' -ForegroundColor Green

try {
    # 下载 MinGW
    Invoke-WebRequest -Uri $mingwUrl -OutFile $downloadPath

    Write-Host '下载完成，正在解压...' -ForegroundColor Green

    # 创建安装目录
    if (!(Test-Path $installPath)) {
        New-Item -ItemType Directory -Path $installPath -Force
    }

    # 需要 7zip 来解压
    Write-Host "请确保已安装 7-Zip 或手动解压文件到: $installPath" -ForegroundColor Yellow
    Write-Host "下载的文件位置: $downloadPath" -ForegroundColor Yellow

    # 添加到 PATH
    $currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
    $mingwBinPath = "$installPath\bin"

    if ($currentPath -notlike "*$mingwBinPath*") {
        [Environment]::SetEnvironmentVariable('PATH', "$currentPath;$mingwBinPath", 'User')
        Write-Host '已添加 MinGW 到用户 PATH 环境变量' -ForegroundColor Green
        Write-Host '请重启 PowerShell 或 VS Code 以使更改生效' -ForegroundColor Yellow
    }

} catch {
    Write-Host "下载失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host '请手动下载并安装 MinGW-w64' -ForegroundColor Yellow
}
