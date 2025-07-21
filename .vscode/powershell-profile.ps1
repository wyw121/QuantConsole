# QuantConsole PowerShell 配置文件
# 用于优化 VS Code 终端中的 PowerShell 体验

# 设置 PowerShell 预测行为，避免窗口大小警告
Set-PSReadLineOption -PredictionSource None
Set-PSReadLineOption -PredictionViewStyle InlineView

# 禁用一些可能导致警告的功能
$PSDefaultParameterValues['Out-Default:OutVariable'] = $null

# 设置更友好的错误显示
$ErrorView = 'ConciseView'

# 优化命令历史
Set-PSReadLineOption -HistorySearchCursorMovesToEnd
Set-PSReadLineOption -MaximumHistoryCount 4000

# 设置键绑定
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward

# 显示启动信息
Write-Host "🚀 QuantConsole PowerShell 环境已就绪！" -ForegroundColor Green
Write-Host "📁 工作目录: $(Get-Location)" -ForegroundColor Cyan

# 设置别名简化开发命令
Set-Alias -Name dev-start -Value { & ".\start-dev.bat" }
Set-Alias -Name dev-stop -Value { docker-compose down }
Set-Alias -Name dev-logs -Value { docker-compose logs -f }

# 函数：快速切换到项目目录
function Set-ProjectLocation {
    param(
        [ValidateSet("frontend", "backend", "migration", "root")]
        [string]$Location = "root"
    )

    switch ($Location) {
        "frontend" { Set-Location ".\frontend" }
        "backend" { Set-Location ".\backend" }
        "migration" { Set-Location ".\backend\migration" }
        "root" { Set-Location ".\" }
    }
    Write-Host "📍 切换到: $(Get-Location)" -ForegroundColor Yellow
}

# 设置别名
Set-Alias -Name cd-fe -Value { Set-ProjectLocation -Location "frontend" }
Set-Alias -Name cd-be -Value { Set-ProjectLocation -Location "backend" }
Set-Alias -Name cd-db -Value { Set-ProjectLocation -Location "migration" }
Set-Alias -Name cd-root -Value { Set-ProjectLocation -Location "root" }
