# 简单的 MinGW 解压和配置脚本

$zipFile = "$env:TEMP\mingw.7z"
$extractPath = "$env:USERPROFILE\mingw64"

Write-Host '正在解压 MinGW-w64...' -ForegroundColor Green

try {
    # 创建目标目录
    if (!(Test-Path $extractPath)) {
        New-Item -ItemType Directory -Path $extractPath -Force
    }

    # 使用 PowerShell 内置的解压功能（适用于 .zip 文件）
    # 或者尝试使用 tar 命令（Windows 10+ 内置）
    if (Get-Command tar -ErrorAction SilentlyContinue) {
        Write-Host '使用 tar 命令解压...' -ForegroundColor Yellow
        tar -xf $zipFile -C $extractPath --strip-components=1
    } else {
        Write-Host '需要手动解压 7z 文件' -ForegroundColor Yellow
        Write-Host "文件位置: $zipFile" -ForegroundColor Cyan
        Write-Host "解压到: $extractPath" -ForegroundColor Cyan
        Write-Host '请下载 7-Zip 或 WinRAR 解压文件' -ForegroundColor Yellow
        return
    }

    # 检查解压是否成功
    $binPath = "$extractPath\bin"
    if (Test-Path "$binPath\gcc.exe") {
        Write-Host '解压成功！' -ForegroundColor Green

        # 添加到 PATH
        $currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
        if ($currentPath -notlike "*$binPath*") {
            [Environment]::SetEnvironmentVariable('PATH', "$currentPath;$binPath", 'User')
            Write-Host '已添加 MinGW 到用户 PATH' -ForegroundColor Green
            Write-Host '请重启 PowerShell 以使更改生效' -ForegroundColor Yellow
        }

        # 测试编译器
        Write-Host '测试 GCC 编译器...' -ForegroundColor Yellow
        & "$binPath\gcc.exe" --version

    } else {
        Write-Host '解压失败或路径不正确' -ForegroundColor Red
    }

} catch {
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
}
